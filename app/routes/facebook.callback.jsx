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
    `https://${host}/facebook/callback`;

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

  // Exchange code for token
  const tokenResponse = await fetch(
    "https://graph.facebook.com/v23.0/oauth/access_token?" +
      new URLSearchParams({
        client_id: process.env.FACEBOOK_CLIENT_ID,
        client_secret:
          process.env.FACEBOOK_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        code,
      })
  );

  const tokens = await tokenResponse.json();

  console.log("FACEBOOK TOKENS:", tokens);

  if (!tokens.access_token) {
    console.log(tokens);

    return new Response(
      "Facebook token exchange failed",
      {
        status: 400,
      }
    );
  }

  // Get Facebook user
  const userResponse = await fetch(
    `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokens.access_token}`
  );

  const facebookUser = await userResponse.json();

  console.log("FACEBOOK USER:", facebookUser);

  const shopSession =
    await prisma.session.findFirst({
      where: {
        isOnline: false,
      },
    });

  if (!shopSession) {
    throw new Error("No Shopify session found");
  }

  const { admin } =
    await unauthenticated.admin(shopSession.shop);

  let shopifyCustomerId = null;

  // Check existing customer
  const existingCustomerResponse =
    await admin.graphql(`
      #graphql
      query{
        customers(first:1,query:"email:${facebookUser.email}"){
          edges{
            node{
              id
              email
            }
          }
        }
      }
    `);

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
        mutation customerCreate($input: CustomerInput!){
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
              email: facebookUser.email,
              firstName:
                facebookUser.name.split(" ")[0],
              lastName:
                facebookUser.name
                  .split(" ")
                  .slice(1)
                  .join(" "),
            },
          },
        }
      );

    const result =
      await customerResponse.json();

    console.log(result);

    const customerCreateResult =
      result.data?.customerCreate;

    if (
      customerCreateResult.userErrors.length > 0
    ) {
      return new Response(
        "Customer creation failed",
        {
          status: 400,
        }
      );
    }

    shopifyCustomerId =
      customerCreateResult.customer.id;
  }

  // Save user
  const user =
    await prisma.facebookUser.upsert({
      where: {
        email: facebookUser.email,
      },
      update: {
        name: facebookUser.name,
        profileImage:
          facebookUser.picture?.data?.url,
        shopifyCustomerId,
      },
      create: {
        facebookId: facebookUser.id,
        name: facebookUser.name,
        email: facebookUser.email,
        profileImage:
          facebookUser.picture?.data?.url,
        shopifyCustomerId,
      },
    });

  console.log("DATABASE USER:", user);

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

  return redirect(
    `${redirect_uri}?code=${authCode}&state=${state}`
  );
}

export default function FacebookCallback() {
  return null;
}