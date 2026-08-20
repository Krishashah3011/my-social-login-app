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
  const shopML = settingsML?.shop;
  const { clientId: clientIdML, clientSecret: clientSecretML, callbackUrl: callbackUrlML } =
    getProviderCredentialsML(settingsML, "google", `https://${hostML}/google/callback`);

  if (!codeML) {
    return new Response("No authorization code received", { status: 400 });
  }

  if (!stateDataML) {
    return new Response("Missing state", { status: 400 });
  }

  const [stateML, redirect_uriML, nonceML] = stateDataML.split("|");

  const tokenResponseML = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientIdML,
        client_secret: clientSecretML,
        code: codeML,
        grant_type: "authorization_code",
        redirect_uri: callbackUrlML,
      }),
    }
  );

  const tokensML = await tokenResponseML.json();

  if (!tokensML.access_token) {
    return new Response("Google token exchange failed", {
      status: 400,
    });
  }

  const userResponseML = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokensML.access_token}`,
      },
    }
  );

  const googleUserML = await userResponseML.json();

  let shopifyCustomerIdML = null;
  let userML;

  try {
    const shopSessionML = await prisma.session.findFirst({
      where: shopML ? { shop: shopML, isOnline: false } : { isOnline: false },
    });

    if (!shopSessionML) {
      return new Response(
        `No Shopify session found for shop "${shopML || "(no ShopSettings row saved yet — open the app's Settings or Account page once)"}". ` +
          `The app may not be installed on this store yet, or its offline session was lost — reinstall the app on this store.`,
        { status: 500 }
      );
    }

    const { admin: adminML } = await unauthenticated.admin(shopSessionML.shop);

    const existingCustomerResponseML = await adminML.graphql(
      `#graphql
      query {
        customers(first:1, query:"email:${googleUserML.email}") {
          edges {
            node {
              id
              email
            }
          }
        }
      }`
    );

    const existingDataML = await existingCustomerResponseML.json();

    const existingCustomerML =
      existingDataML.data?.customers?.edges[0]?.node;

    if (existingCustomerML) {
      shopifyCustomerIdML = existingCustomerML.id;

    } else {
      const customerResponseML = await adminML.graphql(
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
              email: googleUserML.email,
              firstName: googleUserML.given_name,
              lastName: googleUserML.family_name,
            },
          },
        }
      );

      const resultML = await customerResponseML.json();

      const customerCreateResultML =
        resultML.data?.customerCreate;

      if (!customerCreateResultML) {
        console.error("[google.callback] customerCreate returned no data:", JSON.stringify(resultML));
        return new Response(
          "Customer creation failed — the Admin API returned no data (often a missing scope, e.g. write_customers). Check the server log for the raw response.",
          { status: 500 }
        );
      }

      if (customerCreateResultML.userErrors.length > 0) {
        console.error("[google.callback] customerCreate userErrors:", customerCreateResultML.userErrors);
        return new Response(
          `Customer creation failed: ${customerCreateResultML.userErrors.map((e) => e.message).join(", ")}`,
          { status: 400 }
        );
      }

      shopifyCustomerIdML = customerCreateResultML.customer?.id;
    }

    userML = await prisma.googleUser.upsert({
      where: {
        email: googleUserML.email,
      },
      update: {
        name: googleUserML.name,
        profileImage: googleUserML.picture,
        shopifyCustomerId: shopifyCustomerIdML,
      },
      create: {
        googleId: googleUserML.id,
        name: googleUserML.name,
        email: googleUserML.email,
        profileImage: googleUserML.picture,
        shopifyCustomerId: shopifyCustomerIdML,
      },
    });
  } catch (errML) {
    if (errML instanceof Response) {
      const bodyTextML = await errML.text().catch(() => "");
      console.error(
        `[google.callback] Shopify Admin API/session threw a Response — status ${errML.status}:`,
        bodyTextML || "(empty body)"
      );
      return new Response(
        `Google login failed talking to the Shopify Admin API (status ${errML.status}). This usually means the offline session for this shop is invalid, expired, or missing a required scope — try uninstalling and reinstalling the app on this store, then check the Session row's "scope" column in Prisma Studio.`,
        { status: 500 }
      );
    }
    console.error("[google.callback] Unexpected error:", errML);
    return new Response(`Google login failed: ${errML.message}`, { status: 500 });
  }

  const authCodeML = crypto.randomUUID();

  await saveCode(authCodeML, {
    email: userML.email,
    name: userML.name,
    id: shopifyCustomerIdML,
    nonce: nonceML,
  });

  if (!redirect_uriML) {
    return new Response(
      "Missing redirect_uri",
      { status: 400 }
    );
  }

  return redirect(
    `${redirect_uriML}?code=${authCodeML}&state=${stateML}`
  );
}

export default function GoogleCallback() {
  return null;
}