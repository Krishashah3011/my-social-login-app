import { redirect } from "react-router";
import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";
import crypto from "crypto";
import { saveCode } from "../utils/authCodes.server";

export async function loader({ request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateData = url.searchParams.get("state");

  // Build callback URL dynamically from the incoming request — must match what authorize.jsx sent
  const host = request.headers.get("x-forwarded-host") || url.host;
  const callbackUrl = `https://${host}/google/callback`;

  if (!code) {
    return new Response("No authorization code received", { status: 400 });
  }

  // Recover Shopify state + redirect URI
  const [state, redirect_uri, nonce] = stateData.split("|");

  // Exchange Google code for token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: callbackUrl,
    }),
  });

  const tokens = await tokenResponse.json();

  console.log("GOOGLE TOKENS:", tokens);

  if (!tokens.access_token) {
    console.log("GOOGLE TOKEN ERROR:", tokens);
    return new Response("Google token exchange failed", { status: 400 });
  }

  // Get Google user
  const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });

  const googleUser = await userResponse.json();

  console.log("GOOGLE USER:", googleUser);

  // Shopify offline session
  const shopSession = await prisma.session.findFirst({
    where: { isOnline: false },
  });

  if (!shopSession) {
    throw new Error("No Shopify session found");
  }

  // Shopify Admin API
  const { admin } = await unauthenticated.admin(shopSession.shop);

  let shopifyCustomerId = null;

  // Check existing customer
  const existingCustomerResponse = await admin.graphql(
    `#graphql
    query {
      customers(first:1, query:"email:${googleUser.email}") {
        edges {
          node {
            id
            email
          }
        }
      }
    }`
  );

  const existingData = await existingCustomerResponse.json();
  const existingCustomer = existingData.data?.customers?.edges[0]?.node;

  if (existingCustomer) {
    shopifyCustomerId = existingCustomer.id;
    console.log("Existing customer:", shopifyCustomerId);
  } else {
    const customerResponse = await admin.graphql(
      `#graphql
      mutation customerCreate($input: CustomerInput!) {
        customerCreate(input:$input){
          customer{
            id
            email
          }
          userErrors{
            field
            message
          }
        }
      }`,
      {
        variables: {
          input: {
            email: googleUser.email,
            firstName: googleUser.given_name,
            lastName: googleUser.family_name,
          },
        },
      }
    );

    const result = await customerResponse.json();
    console.log("Created customer:", result);
    shopifyCustomerId = result.data.customerCreate.customer?.id;
  }

  // Save user in Prisma
  const user = await prisma.googleUser.upsert({
    where: { email: googleUser.email },
    update: {
      name: googleUser.name,
      profileImage: googleUser.picture,
      shopifyCustomerId,
    },
    create: {
      googleId: googleUser.id,
      name: googleUser.name,
      email: googleUser.email,
      profileImage: googleUser.picture,
      shopifyCustomerId,
    },
  });

  console.log("DATABASE USER:", user);

  // Create temporary authorization code
  const authCode = crypto.randomUUID();

  saveCode(authCode, {
    email: user.email,
    name: user.name,
    id: user.id,
    nonce,
  });

  console.log("AUTH CODE CREATED:", authCode);

  if (!redirect_uri) {
    return new Response("Missing redirect_uri", { status: 400 });
  }

  console.log("REDIRECTING TO SHOPIFY:", redirect_uri);

  return redirect(`${redirect_uri}?code=${authCode}&state=${state}`);
}

export default function GoogleCallback() {
  return null;
}