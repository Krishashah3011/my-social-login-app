import { redirect } from "react-router";
import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";
import crypto from "crypto";
import { saveCode } from "../utils/authCodes.server";
import { getVerifier } from "../lib/twitterPkce.server";
import { getShopSettingsML, getProviderCredentialsML } from "../utils/providerCredentials.server";

export async function loader({ request: requestML }) {
  const urlML = new URL(requestML.url);

  const codeML = urlML.searchParams.get("code");
  const stateDataML = urlML.searchParams.get("state");

  const hostML = requestML.headers.get("x-forwarded-host") || urlML.host;

  const settingsML = await getShopSettingsML();
  const shopML = settingsML?.shop;
  const { clientId: clientIdML, clientSecret: clientSecretML, callbackUrl: callbackUrlML } =
    getProviderCredentialsML(settingsML, "twitter", `https://${hostML}/twitter/callback`);

  if (!codeML) {
    return new Response("No Twitter authorization code received", { status: 400 });
  }

  if (!stateDataML) {
    return new Response("Missing state", { status: 400 });
  }

  const [stateML, redirect_uriML, nonceML] = stateDataML.split("|");

  const codeVerifierML = getVerifier(stateML);

  if (!codeVerifierML) {
    return new Response("Missing or expired PKCE verifier for this login attempt", { status: 400 });
  }

  const tokenResponseML = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${clientIdML}:${clientSecretML}`).toString("base64"),
    },
    body: new URLSearchParams({
      code: codeML,
      grant_type: "authorization_code",
      client_id: clientIdML,
      redirect_uri: callbackUrlML,
      code_verifier: codeVerifierML,
    }),
  });

  const tokensML = await tokenResponseML.json();

  if (!tokensML.access_token) {
    return new Response("Twitter token exchange failed", { status: 400 });
  }

  const userResponseML = await fetch(
    "https://api.twitter.com/2/users/me?user.fields=confirmed_email,profile_image_url,name,username",
    {
      headers: { Authorization: `Bearer ${tokensML.access_token}` },
    }
  );

  const twitterUserDataML = await userResponseML.json();
  const twitterUserML = twitterUserDataML.data;

  if (!twitterUserML?.confirmed_email) {
    return new Response(
      "Twitter did not return an email for this account. Check 'Request email from users' is enabled in the X Developer Portal and that the users.email scope was granted.",
      { status: 400 }
    );
  }

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
        customers(first:1, query:"email:${twitterUserML.confirmed_email}") {
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
    const existingCustomerML = existingDataML.data?.customers?.edges[0]?.node;

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
              email: twitterUserML.confirmed_email,
              firstName: twitterUserML.name || "",
            },
          },
        }
      );

      const resultML = await customerResponseML.json();
      const customerCreateResultML = resultML.data?.customerCreate;

      if (!customerCreateResultML) {
        console.error("[twitter.callback] customerCreate returned no data:", JSON.stringify(resultML));
        return new Response(
          "Customer creation failed — the Admin API returned no data (often a missing scope, e.g. write_customers). Check the server log for the raw response.",
          { status: 500 }
        );
      }

      if (customerCreateResultML.userErrors.length > 0) {
        console.error("[twitter.callback] customerCreate userErrors:", customerCreateResultML.userErrors);
        return new Response(
          `Customer creation failed: ${customerCreateResultML.userErrors.map((e) => e.message).join(", ")}`,
          { status: 400 }
        );
      }

      shopifyCustomerIdML = customerCreateResultML.customer.id;
    }

    userML = await prisma.twitterUser.upsert({
      where: { email: twitterUserML.confirmed_email },
      update: {
        name: twitterUserML.name,
        profileImage: twitterUserML.profile_image_url,
        shopifyCustomerId: shopifyCustomerIdML,
      },
      create: {
        twitterId: twitterUserML.id,
        name: twitterUserML.name,
        email: twitterUserML.confirmed_email,
        profileImage: twitterUserML.profile_image_url,
        shopifyCustomerId: shopifyCustomerIdML,
      },
    });
  } catch (errML) {
    if (errML instanceof Response) {
      const bodyTextML = await errML.text().catch(() => "");
      console.error(
        `[twitter.callback] Shopify Admin API/session threw a Response — status ${errML.status}:`,
        bodyTextML || "(empty body)"
      );
      return new Response(
        `Twitter login failed talking to the Shopify Admin API (status ${errML.status}). This usually means the offline session for this shop is invalid, expired, or missing a required scope — try uninstalling and reinstalling the app on this store, then check the Session row's "scope" column in Prisma Studio.`,
        { status: 500 }
      );
    }
    console.error("[twitter.callback] Unexpected error:", errML);
    return new Response(`Twitter login failed: ${errML.message}`, { status: 500 });
  }

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

export default function TwitterCallback() {
  return null;
}