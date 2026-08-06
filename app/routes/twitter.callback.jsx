import { redirect } from "react-router";
import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";
import crypto from "crypto";
import { saveCode } from "../utils/authCodes.server";
import { getVerifier } from "../lib/twitterPkce.server";

export async function loader({ request }) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const stateData = url.searchParams.get("state");

  const host = request.headers.get("x-forwarded-host") || url.host;
  const callbackUrl = `https://${host}/twitter/callback`;

  if (!code) {
    return new Response("No Twitter authorization code received", { status: 400 });
  }

  if (!stateData) {
    return new Response("Missing state", { status: 400 });
  }

  const [state, redirect_uri, nonce] = stateData.split("|");

  const codeVerifier = getVerifier(state);

  if (!codeVerifier) {
    return new Response("Missing or expired PKCE verifier for this login attempt", { status: 400 });
  }

  const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString("base64"),
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: process.env.X_CLIENT_ID,
      redirect_uri: callbackUrl,
      code_verifier: codeVerifier,
    }),
  });

  const tokens = await tokenResponse.json();

  if (!tokens.access_token) {
    return new Response("Twitter token exchange failed", { status: 400 });
  }

  const userResponse = await fetch(
    "https://api.twitter.com/2/users/me?user.fields=confirmed_email,profile_image_url,name,username",
    {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    }
  );

  const twitterUserData = await userResponse.json();

  const twitterUser = twitterUserData.data;

  if (!twitterUser?.confirmed_email) {
    return new Response(
      "Twitter did not return an email for this account. Check 'Request email from users' is enabled in the X Developer Portal and that the users.email scope was granted.",
      { status: 400 }
    );
  }

  const shopSession = await prisma.session.findFirst({ where: { isOnline: false } });

  if (!shopSession) {
    throw new Error("No Shopify session found");
  }

  const { admin } = await unauthenticated.admin(shopSession.shop);

  let shopifyCustomerId = null;

  const existingCustomerResponse = await admin.graphql(
    `#graphql
    query {
      customers(first:1, query:"email:${twitterUser.confirmed_email}") {
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
            email: twitterUser.confirmed_email,
            firstName: twitterUser.name || "",
          },
        },
      }
    );

    const result = await customerResponse.json();

    const customerCreateResult = result.data?.customerCreate;

    if (!customerCreateResult) {
      return new Response("Customer creation failed", { status: 400 });
    }

    if (customerCreateResult.userErrors.length > 0) {
      return new Response("Customer creation failed", { status: 400 });
    }

    shopifyCustomerId = customerCreateResult.customer.id;
  }

  const user = await prisma.twitterUser.upsert({
    where: { email: twitterUser.confirmed_email },
    update: {
      name: twitterUser.name,
      profileImage: twitterUser.profile_image_url,
      shopifyCustomerId,
    },
    create: {
      twitterId: twitterUser.id,
      name: twitterUser.name,
      email: twitterUser.confirmed_email,
      profileImage: twitterUser.profile_image_url,
      shopifyCustomerId,
    },
  });

  const authCode = crypto.randomUUID();

  await saveCode(authCode, {
    email: user.email,
    name: user.name,
    id: shopifyCustomerId,
    nonce,
  });

  if (!redirect_uri) {
    return new Response("Missing redirect_uri", { status: 400 });
  }

  return redirect(`${redirect_uri}?code=${authCode}&state=${state}`);
}

export default function TwitterCallback() {
  return null;
}