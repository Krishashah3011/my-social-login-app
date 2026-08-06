import db from "../db.server";
import { authenticate } from "../shopify.server";

const ALLOWED_PROVIDERS = ["google", "linkedin", "facebook", "twitter", "amazon"];
const LOGO_FIELD = {
  google: "googleLogo",
  linkedin: "linkedinLogo",
  facebook: "facebookLogo",
  twitter: "twitterLogo",
  amazon: "amazonLogo",
};
const ENABLED_FIELD = {
  google: "googleEnabled",
  linkedin: "linkedinEnabled",
  facebook: "facebookEnabled",
  twitter: "twitterEnabled",
  amazon: "amazonEnabled",
};

const STAGED_UPLOADS_CREATE = `#graphql
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

const FILE_CREATE = `#graphql
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

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const provider = formData.get("provider");
  const intent = formData.get("intent");

  if (!ALLOWED_PROVIDERS.includes(provider)) {
    return { error: "Invalid provider" };
  }

  const settings = await db.shopSettings.findUnique({
    where: { shop: session.shop },
  });

  if (!settings || !settings[ENABLED_FIELD[provider]]) {
    return { error: "Provider is disabled" };
  }

  // ---- Reset to default ----
  if (intent === "reset") {
    const updated = await db.shopSettings.update({
      where: { shop: session.shop },
      data: { [LOGO_FIELD[provider]]: null },
    });
    return { settings: updated };
  }

  // ---- Upload new logo ----
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return { error: "No file provided" };
  }

  const filename = file.name || `${provider}-logo.png`;
  const mimeType = file.type || "image/png";
  const fileSize = String(file.size);

  // Step 1: ask Shopify for a staged upload target
  const stagedResponse = await admin.graphql(STAGED_UPLOADS_CREATE, {
    variables: {
      input: [
        {
          filename,
          mimeType,
          fileSize,
          resource: "FILE",
          httpMethod: "POST",
        },
      ],
    },
  });
  const stagedJson = await stagedResponse.json();
  const stagedErrors = stagedJson.data?.stagedUploadsCreate?.userErrors || [];
  if (stagedErrors.length) {
    return { error: stagedErrors.map((e) => e.message).join(", ") };
  }

  const target = stagedJson.data.stagedUploadsCreate.stagedTargets[0];

  // Step 2: upload the actual file bytes to the staged target URL
  const uploadForm = new FormData();
  target.parameters.forEach((param) => {
    uploadForm.append(param.name, param.value);
  });
  uploadForm.append("file", file, filename);

  const uploadRes = await fetch(target.url, {
    method: "POST",
    body: uploadForm,
  });

  if (!uploadRes.ok) {
    return { error: "Upload to Shopify storage failed" };
  }

  // Step 3: register the uploaded file as a permanent Shopify File
  const fileCreateResponse = await admin.graphql(FILE_CREATE, {
    variables: {
      files: [
        {
          alt: `${provider} login icon`,
          contentType: "IMAGE",
          originalSource: target.resourceUrl,
        },
      ],
    },
  });
  const fileCreateJson = await fileCreateResponse.json();
  const fileErrors = fileCreateJson.data?.fileCreate?.userErrors || [];
  if (fileErrors.length) {
    return { error: fileErrors.map((e) => e.message).join(", ") };
  }

  // fileCreate returns the file async — image.url may briefly be null right after creation.
  // Fallback to resourceUrl (works immediately) if image.url isn't ready yet.
  const createdFile = fileCreateJson.data.fileCreate.files[0];
  const finalUrl = createdFile?.image?.url || target.resourceUrl;

  const updated = await db.shopSettings.update({
    where: { shop: session.shop },
    data: { [LOGO_FIELD[provider]]: finalUrl },
  });

  return { settings: updated };
};