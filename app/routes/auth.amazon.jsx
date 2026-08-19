import { getShopSettingsML, getProviderCredentialsML } from "../utils/providerCredentials.server";

export async function loader({ request: requestML }) {
  const urlML = new URL(requestML.url);

  const stateML = urlML.searchParams.get("state");
  const redirect_uriML = urlML.searchParams.get("redirect_uri");
  const nonceML = urlML.searchParams.get("nonce");

  const settingsML = await getShopSettingsML();

  if (settingsML && (!settingsML.appEnabled || !settingsML.amazonEnabled)) {
    const backToSelectorML =
      `/select-provider?` +
      `state=${encodeURIComponent(stateML || "")}` +
      `&redirect_uri=${encodeURIComponent(redirect_uriML || "")}` +
      `&nonce=${encodeURIComponent(nonceML || "")}`;
    return Response.redirect(new URL(backToSelectorML, urlML.origin));
  }

  const hostML = requestML.headers.get("x-forwarded-host") || urlML.host;

  const { clientId: clientIdML, callbackUrl: callbackUrlML } = getProviderCredentialsML(
    settingsML,
    "amazon",
    `https://${hostML}/amazon/callback`
  );

  if (!clientIdML) {
    return new Response(
      "Amazon login isn't configured for this shop yet. Add a Client ID in the app's Client Settings page (or set AMAZON_CLIENT_ID in .env).",
      { status: 500 }
    );
  }

  const amazonURLML =
    `https://www.amazon.com/ap/oa?` +
    `client_id=${clientIdML}` +
    `&redirect_uri=${encodeURIComponent(callbackUrlML)}` +
    `&response_type=code` +
    `&scope=profile` +
    `&state=${encodeURIComponent(`${stateML}|${redirect_uriML}|${nonceML}`)}`;

  return Response.redirect(amazonURLML);
}

export default function AmazonAuth() {
  return null;
}