import db from "../db.server";
import { authenticate } from "../shopify.server";

const ALLOWED_PROVIDERS_ML = ["google", "linkedin", "facebook", "twitter", "amazon"];
const LOGO_FIELD_ML = {
  google: "googleLogo",
  linkedin: "linkedinLogo",
  facebook: "facebookLogo",
  twitter: "twitterLogo",
  amazon: "amazonLogo",
};
const ENABLED_FIELD_ML = {
  google: "googleEnabled",
  linkedin: "linkedinEnabled",
  facebook: "facebookEnabled",
  twitter: "twitterEnabled",
  amazon: "amazonEnabled",
};

const STAGED_UPLOADS_CREATE_ML = `#graphql
  mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters { name value }
      }
      userErrors { field message }
    }
  }
`;

const FILE_CREATE_ML = `#graphql
  mutation fileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        id
        ... on MediaImage {
          image { url }
        }
      }
      userErrors { field message }
    }
  }
`;

export const action = async ({ request: requestML }) => {
  const { session: sessionML, admin: adminML } = await authenticate.admin(requestML);
  const formDataML = await requestML.formData();

  const providerML = formDataML.get("provider");
  const intentML = formDataML.get("intent");

  if (!ALLOWED_PROVIDERS_ML.includes(providerML)) {
    return { error: "Invalid provider" };
  }

  const settingsML = await db.shopSettings.findUnique({
    where: { shop: sessionML.shop },
  });

  if (!settingsML || !settingsML[ENABLED_FIELD_ML[providerML]]) {
    return { error: "Provider is disabled" };
  }

  if (intentML === "reset") {
    const updatedML = await db.shopSettings.update({
      where: { shop: sessionML.shop },
      data: { [LOGO_FIELD_ML[providerML]]: null },
    });
    return { settings: updatedML };
  }

  const fileML = formDataML.get("file");
  if (!fileML || typeof fileML === "string") {
    return { error: "No file provided" };
  }

  const filenameML = fileML.name || `${providerML}-logo.png`;
  const mimeTypeML = fileML.type || "image/png";
  const fileSizeML = String(fileML.size);

  const stagedResponseML = await adminML.graphql(STAGED_UPLOADS_CREATE_ML, {
    variables: {
      input: [
        {
          filename: filenameML,
          mimeType: mimeTypeML,
          fileSize: fileSizeML,
          resource: "FILE",
          httpMethod: "POST",
        },
      ],
    },
  });
  const stagedJsonML = await stagedResponseML.json();
  const stagedErrorsML = stagedJsonML.data?.stagedUploadsCreate?.userErrors || [];
  if (stagedErrorsML.length) {
    return { error: stagedErrorsML.map((eML) => eML.message).join(", ") };
  }

  const targetML = stagedJsonML.data.stagedUploadsCreate.stagedTargets[0];

  const uploadFormML = new FormData();
  targetML.parameters.forEach((paramML) => {
    uploadFormML.append(paramML.name, paramML.value);
  });
  uploadFormML.append("file", fileML, filenameML);

  const uploadResML = await fetch(targetML.url, {
    method: "POST",
    body: uploadFormML,
  });

  if (!uploadResML.ok) {
    return { error: "Upload to Shopify storage failed" };
  }

  const fileCreateResponseML = await adminML.graphql(FILE_CREATE_ML, {
    variables: {
      files: [
        {
          alt: `${providerML} login icon`,
          contentType: "IMAGE",
          originalSource: targetML.resourceUrl,
        },
      ],
    },
  });
  const fileCreateJsonML = await fileCreateResponseML.json();
  const fileErrorsML = fileCreateJsonML.data?.fileCreate?.userErrors || [];
  if (fileErrorsML.length) {
    return { error: fileErrorsML.map((eML) => eML.message).join(", ") };
  }

  const createdFileML = fileCreateJsonML.data.fileCreate.files[0];
  const finalUrlML = createdFileML?.image?.url || targetML.resourceUrl;

  const updatedML = await db.shopSettings.update({
    where: { shop: sessionML.shop },
    data: { [LOGO_FIELD_ML[providerML]]: finalUrlML },
  });

  return { settings: updatedML };
};