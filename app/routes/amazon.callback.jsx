import { redirect } from "react-router";
import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";
import crypto from "crypto";
import { saveCode } from "../utils/authCodes.server";

export async function loader({ request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateData = url.searchParams.get("state");

  const host = request.headers.get("x-forwarded-host") || url.host;
  const callbackUrl = `https://${host}/amazon/callback`;

  if (!code) {
    return new Response("No authorization code received", { status: 400 });
  }

  if (!stateData) {
    return new Response("Missing state", { status: 400 });
  }

  const [state, redirect_uri, nonce] = stateData.split("|");

  // Exchange Amazon code for token
  const tokenResponse = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.AMAZON_CLIENT_ID,
      client_secret: process.env.AMAZON_CLIENT_SECRET,
      redirect_uri: callbackUrl,
    }),
  });

  const tokens = await tokenResponse.json();
  console.log("AMAZON TOKENS:", tokens);

  if (!tokens.access_token) {
    console.log("AMAZON TOKEN ERROR:", tokens);
    return new Response("Amazon token exchange failed", { status: 400 });
  }

  // Get Amazon user profile
  const userResponse = await fetch("https://api.amazon.com/user/profile", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const amazonUser = await userResponse.json();
  console.log("AMAZON USER:", amazonUser);

  if (!amazonUser.email) {
    console.log("AMAZON USER MISSING EMAIL:", amazonUser);
    return new Response("Amazon profile missing email", { status: 400 });
  }

  // Shopify offline session
  const shopSession = await prisma.session.findFirst({
    where: { isOnline: false },
  });

  if (!shopSession) {
    throw new Error("No Shopify session found");
  }

  const { admin } = await unauthenticated.admin(shopSession.shop);

  let shopifyCustomerId = null;

  const existingCustomerResponse = await admin.graphql(
    `#graphql
    query {
      customers(first:1, query:"email:${amazonUser.email}") {
        edges { node { id email } }
      }
    }`,
  );

  const existingData = await existingCustomerResponse.json();
  const existingCustomer = existingData.data?.customers?.edges[0]?.node;

  if (existingCustomer) {
    shopifyCustomerId = existingCustomer.id;
    console.log("Existing customer:", shopifyCustomerId);
  } else {
    const nameParts = (amazonUser.name || "").split(" ");
    const customerResponse = await admin.graphql(
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
            email: amazonUser.email,
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
          },
        },
      },
    );

    const result = await customerResponse.json();
    console.log("Created customer:", result);

    const customerCreateResult = result.data?.customerCreate;

    if (!customerCreateResult || customerCreateResult.userErrors.length > 0) {
      console.log("CUSTOMER CREATE ERROR:", result);
      return new Response("Customer creation failed", { status: 400 });
    }

    shopifyCustomerId = customerCreateResult.customer?.id;
    console.log("NEW SHOPIFY CUSTOMER ID:", shopifyCustomerId);
  }

  // Save user in Prisma
  const user = await prisma.amazonUser.upsert({
    where: { email: amazonUser.email },
    update: {
      name: amazonUser.name,
      shopifyCustomerId,
    },
    create: {
      amazonId: amazonUser.user_id,
      name: amazonUser.name,
      email: amazonUser.email,
      shopifyCustomerId,
    },
  });

  console.log("DATABASE USER:", user);

  const authCode = crypto.randomUUID();

  await saveCode(authCode, {
    email: user.email,
    name: user.name,
    id: shopifyCustomerId,
    nonce,
  });

  console.log("AUTH CODE CREATED:", authCode);

  if (!redirect_uri) {
    return new Response("Missing redirect_uri", { status: 400 });
  }

  console.log("REDIRECTING TO SHOPIFY:", redirect_uri);

  return redirect(`${redirect_uri}?code=${authCode}&state=${state}`);
}

export default function AmazonCallback() {
  return null;
}