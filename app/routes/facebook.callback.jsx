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

  const hostML =
    requestML.headers.get("x-forwarded-host") || urlML.host;

  const settingsML = await getShopSettingsML();
  const { clientId: clientIdML, clientSecret: clientSecretML, callbackUrl: callbackUrlML } =
    getProviderCredentialsML(settingsML, "facebook", `https://${hostML}/facebook/callback`);

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
    "https://graph.facebook.com/v23.0/oauth/access_token?" +
      new URLSearchParams({
        client_id: clientIdML,
        client_secret: clientSecretML,
        redirect_uri: callbackUrlML,
        code: codeML,
      })
  );

  const tokensML = await tokenResponseML.json();

  if (!tokensML.access_token) {
    return new Response(
      "Facebook token exchange failed",
      {
        status: 400,
      }
    );
  }

  const userResponseML = await fetch(
    `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokensML.access_token}`
  );

  const facebookUserML = await userResponseML.json();

  const shopSessionML =
    await prisma.session.findFirst({
      where: {
        isOnline: false,
      },
    });

  if (!shopSessionML) {
    throw new Error("No Shopify session found");
  }

  const { admin: adminML } =
    await unauthenticated.admin(shopSessionML.shop);

  let shopifyCustomerIdML = null;

  const existingCustomerResponseML =
    await adminML.graphql(`
      #graphql
      query{
        customers(first:1,query:"email:${facebookUserML.email}"){
          edges{
            node{
              id
              email
            }
          }
        }
      }
    `);

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
              email: facebookUserML.email,
              firstName:
                facebookUserML.name.split(" ")[0],
              lastName:
                facebookUserML.name
                  .split(" ")
                  .slice(1)
                  .join(" "),
            },
          },
        }
      );

    const resultML =
      await customerResponseML.json();

    const customerCreateResultML =
      resultML.data?.customerCreate;

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
    await prisma.facebookUser.upsert({
      where: {
        email: facebookUserML.email,
      },
      update: {
        name: facebookUserML.name,
        profileImage:
          facebookUserML.picture?.data?.url,
        shopifyCustomerId: shopifyCustomerIdML,
      },
      create: {
        facebookId: facebookUserML.id,
        name: facebookUserML.name,
        email: facebookUserML.email,
        profileImage:
          facebookUserML.picture?.data?.url,
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

  return redirect(
    `${redirect_uriML}?code=${authCodeML}&state=${stateML}`
  );
}

export default function FacebookCallback() {
  return null;
}