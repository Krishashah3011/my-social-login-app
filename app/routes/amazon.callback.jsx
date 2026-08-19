import { redirect } from "react-router";
import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";
import crypto from "crypto";
import { saveCode } from "../utils/authCodes.server";
import { getShopSettingsML, getProviderCredentialsML } from "../utils/providerCredentials.server";

export async function loader({ request: requestML }) {
  const urlML = new URL(requestML.url);
  const codeML = urlML.searchParams.get("code");
  const stateDataML = urlML.searchParams.get("state");

  const hostML = requestML.headers.get("x-forwarded-host") || urlML.host;

  const settingsML = await getShopSettingsML();
  const { clientId: clientIdML, clientSecret: clientSecretML, callbackUrl: callbackUrlML } =
    getProviderCredentialsML(settingsML, "amazon", `https://${hostML}/amazon/callback`);

  if (!codeML) {
    return new Response("No authorization code received", { status: 400 });
  }

  if (!stateDataML) {
    return new Response("Missing state", { status: 400 });
  }

  const [stateML, redirect_uriML, nonceML] = stateDataML.split("|");

  // Exchange Amazon code for token
  const tokenResponseML = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: codeML,
      client_id: clientIdML,
      client_secret: clientSecretML,
      redirect_uri: callbackUrlML,
    }),
  });

  const tokensML = await tokenResponseML.json();

  if (!tokensML.access_token) {
    return new Response("Amazon token exchange failed", { status: 400 });
  }

  const userResponseML = await fetch("https://api.amazon.com/user/profile", {
    headers: { Authorization: `Bearer ${tokensML.access_token}` },
  });

  const amazonUserML = await userResponseML.json();

  if (!amazonUserML.email) {
    return new Response("Amazon profile missing email", { status: 400 });
  }

  const shopSessionML = await prisma.session.findFirst({
    where: { isOnline: false },
  });

  if (!shopSessionML) {
    throw new Error("No Shopify session found");
  }

  const { admin: adminML } = await unauthenticated.admin(shopSessionML.shop);

  let shopifyCustomerIdML = null;

  const existingCustomerResponseML = await adminML.graphql(
    `#graphql
    query {
      customers(first:1, query:"email:${amazonUserML.email}") {
        edges { node { id email } }
      }
    }`,
  );

  const existingDataML = await existingCustomerResponseML.json();
  const existingCustomerML = existingDataML.data?.customers?.edges[0]?.node;

  if (existingCustomerML) {
    shopifyCustomerIdML = existingCustomerML.id;
  } else {
    const namePartsML = (amazonUserML.name || "").split(" ");
    const customerResponseML = await adminML.graphql(
      `#graphql
      mutation customerCreate($input: CustomerInput!) {
        customerCreate(input:$input){
          customer { id email }
          userErrors { field message }
        }
      }`,
      {
        variables: {
          input: {
            email: amazonUserML.email,
            firstName: namePartsML[0] || "",
            lastName: namePartsML.slice(1).join(" ") || "",
          },
        },
      },
    );

    const resultML = await customerResponseML.json();

    const customerCreateResultML = resultML.data?.customerCreate;

    if (!customerCreateResultML || customerCreateResultML.userErrors.length > 0) {
      return new Response("Customer creation failed", { status: 400 });
    }

    shopifyCustomerIdML = customerCreateResultML.customer?.id;
  }

  const userML = await prisma.amazonUser.upsert({
    where: { email: amazonUserML.email },
    update: {
      name: amazonUserML.name,
      shopifyCustomerId: shopifyCustomerIdML,
    },
    create: {
      amazonId: amazonUserML.user_id,
      name: amazonUserML.name,
      email: amazonUserML.email,
      shopifyCustomerId: shopifyCustomerIdML,
    },
  });

  const authCodeML = crypto.randomUUID();

  await saveCode(authCodeML, {
    email: userML.email,
    name: userML.name,
    id: shopifyCustomerIdML,
    nonce: nonceML,
  });

  if (!redirect_uriML) {
    return new Response("Missing redirect_uri", { status: 400 });
  }

  return redirect(`${redirect_uriML}?code=${authCodeML}&state=${stateML}`);
}

export default function AmazonCallback() {
  return null;
}