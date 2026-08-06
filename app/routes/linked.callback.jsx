import { redirect } from "react-router";
import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";
import crypto from "crypto";
import { saveCode } from "../utils/authCodes.server";


export async function loader({ request }) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const stateData = url.searchParams.get("state");

  const host =
    request.headers.get("x-forwarded-host") || url.host;

  const callbackUrl =
    `https://${host}/linked/callback`;

  if (!code) {
    return new Response("No authorization code received", {
      status: 400,
    });
  }

  if (!stateData) {
    return new Response("Missing state", {
      status: 400,
    });
  }

  const [state, redirect_uri, nonce] =
    stateData.split("|");

  // Exchange linked code for token
  const tokenResponse = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.linked_CLIENT_ID,
        client_secret: process.env.linked_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: callbackUrl,
      }),
    }
  );

  const tokens = await tokenResponse.json();
  console.log("linked TOKENS:", tokens);

  if (!tokens.access_token) {
    console.log("linked TOKEN ERROR:", tokens);

    return new Response(
      "linked token exchange failed",
      {
        status: 400,
      }
    );
  }

  // Get linked user
  const userResponse = await fetch(
    "https://api.linkedin.com/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    }
  );

  const linkedUser = await userResponse.json();

  console.log(
    "linked USER:",
    linkedUser
  );

  // Shopify offline session
  const shopSession = await prisma.session.findFirst({
    where: { isOnline: false },
  });

  if (!shopSession) {
    throw new Error("No Shopify session found");
  }

  const { admin } =
    await unauthenticated.admin(
      shopSession.shop
    );

  let shopifyCustomerId = null;

  // Check existing customer
  const existingCustomerResponse =
    await admin.graphql(
      `#graphql
      query {
        customers(first:1, query:"email:${linkedUser.email}") {
          edges {
            node {
              id
              email
            }
          }
        }
      }`
    );

  const existingData =
    await existingCustomerResponse.json();

  const existingCustomer =
    existingData.data?.customers?.edges[0]?.node;

  if (existingCustomer) {

    shopifyCustomerId =
      existingCustomer.id;

    console.log(
      "Existing customer:",
      shopifyCustomerId
    );

  } else {

    const customerResponse =
      await admin.graphql(
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
              email: linkedUser.email,
              firstName:
                linkedUser.given_name || "",
              lastName:
                linkedUser.family_name || "",
            },
          },
        }
      );

    const result =
      await customerResponse.json();

    console.log(
      "Created customer:",
      result
    );

    const customerCreateResult =
      result.data?.customerCreate;

    if (!customerCreateResult) {
      return new Response(
        "Customer creation failed",
        {
          status: 400,
        }
      );
    }

    if (
      customerCreateResult.userErrors.length > 0
    ) {
      console.log(
        customerCreateResult.userErrors
      );

      return new Response(
        "Customer creation failed",
        {
          status: 400,
        }
      );
    }

    shopifyCustomerId =
      customerCreateResult.customer.id;

    console.log(
      "NEW SHOPIFY CUSTOMER ID:",
      shopifyCustomerId
    );
  }

  // Save linked user
  console.log("PRISMA MODELS:", Object.keys(prisma));
  const user =
    await prisma.linkedUser.upsert({
      where: {
        email: linkedUser.email,
      },
      update: {
        name:
          linkedUser.name,
        profileImage:
          linkedUser.picture,
        shopifyCustomerId,
      },
      create: {
        linkedId:
          linkedUser.sub,
        name:
          linkedUser.name,
        email:
          linkedUser.email,
        profileImage:
          linkedUser.picture,
        shopifyCustomerId,
      },
    });

  console.log(
    "DATABASE USER:",
    user
  );

  // Temporary authorization code
  const authCode =
    crypto.randomUUID();

  await saveCode(authCode, {
    email: user.email,
    name: user.name,
    id: shopifyCustomerId,
    nonce,
  });

  console.log(
    "AUTH CODE CREATED:",
    authCode
  );

  if (!redirect_uri) {
    return new Response(
      "Missing redirect_uri",
      {
        status: 400,
      }
    );
  }

  console.log(
    "REDIRECTING TO SHOPIFY:",
    redirect_uri
  );

  return redirect(
    `${redirect_uri}?code=${authCode}&state=${state}`
  );
}

export default function linkedCallback() {
  return null;
}