import { redirect } from "react-router";
import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";
import crypto from "crypto";
import { saveCode } from "../utils/authCodes.server";


export async function loader({ request: requestML }) {
  const urlML = new URL(requestML.url);

  const codeML = urlML.searchParams.get("code");
  const stateDataML = urlML.searchParams.get("state");

  const hostML =
    requestML.headers.get("x-forwarded-host") || urlML.host;

  const callbackUrlML =
    `https://${hostML}/linked/callback`;

  if (!codeML) {
    return new Response("No authorization code received", {
      status: 400,
    });
  }

  if (!stateDataML) {
    return new Response("Missing state", {
      status: 400,
    });
  }

  const [stateML, redirect_uriML, nonceML] =
    stateDataML.split("|");

  const tokenResponseML = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.linked_CLIENT_ID,
        client_secret: process.env.linked_CLIENT_SECRET,
        code: codeML,
        grant_type: "authorization_code",
        redirect_uri: callbackUrlML,
      }),
    }
  );

  const tokensML = await tokenResponseML.json();

  if (!tokensML.access_token) {
    return new Response(
      "linked token exchange failed",
      {
        status: 400,
      }
    );
  }

  const userResponseML = await fetch(
    "https://api.linkedin.com/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokensML.access_token}`,
      },
    }
  );

  const linkedUserML = await userResponseML.json();
  const shopSessionML = await prisma.session.findFirst({
    where: { isOnline: false },
  });

  if (!shopSessionML) {
    throw new Error("No Shopify session found");
  }

  const { admin: adminML } =
    await unauthenticated.admin(
      shopSessionML.shop
    );

  let shopifyCustomerIdML = null;

  const existingCustomerResponseML =
    await adminML.graphql(
      `#graphql
      query {
        customers(first:1, query:"email:${linkedUserML.email}") {
          edges {
            node {
              id
              email
            }
          }
        }
      }`
    );

  const existingDataML =
    await existingCustomerResponseML.json();

  const existingCustomerML =
    existingDataML.data?.customers?.edges[0]?.node;

  if (existingCustomerML) {

    shopifyCustomerIdML =
      existingCustomerML.id;

  } else {

    const customerResponseML =
      await adminML.graphql(
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
              email: linkedUserML.email,
              firstName:
                linkedUserML.given_name || "",
              lastName:
                linkedUserML.family_name || "",
            },
          },
        }
      );

    const resultML =
      await customerResponseML.json();

    const customerCreateResultML =
      resultML.data?.customerCreate;

    if (!customerCreateResultML) {
      return new Response(
        "Customer creation failed",
        {
          status: 400,
        }
      );
    }

    if (
      customerCreateResultML.userErrors.length > 0
    ) {
      return new Response(
        "Customer creation failed",
        {
          status: 400,
        }
      );
    }

    shopifyCustomerIdML =
      customerCreateResultML.customer.id;
  }

  const userML =
    await prisma.linkedUser.upsert({
      where: {
        email: linkedUserML.email,
      },
      update: {
        name:
          linkedUserML.name,
        profileImage:
          linkedUserML.picture,
        shopifyCustomerId: shopifyCustomerIdML,
      },
      create: {
        linkedId:
          linkedUserML.sub,
        name:
          linkedUserML.name,
        email:
          linkedUserML.email,
        profileImage:
          linkedUserML.picture,
        shopifyCustomerId: shopifyCustomerIdML,
      },
    });

  const authCodeML =
    crypto.randomUUID();

  await saveCode(authCodeML, {
    email: userML.email,
    name: userML.name,
    id: shopifyCustomerIdML,
    nonce: nonceML,
  });

  if (!redirect_uriML) {
    return new Response(
      "Missing redirect_uri",
      {
        status: 400,
      }
    );
  }

  return redirect(
    `${redirect_uriML}?code=${authCodeML}&state=${stateML}`
  );
}

export default function linkedCallback() {
  return null;
}