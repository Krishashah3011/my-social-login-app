import { getShopSettingsML, getProviderCredentialsML } from "../utils/providerCredentials.server";

export async function loader({ request: requestML }) {
  const urlML = new URL(requestML.url);

  const stateML = urlML.searchParams.get("state");
  const redirect_uriML = urlML.searchParams.get("redirect_uri");
  const nonceML = urlML.searchParams.get("nonce");

  const settingsML = await getShopSettingsML();

  if (settingsML && (!settingsML.appEnabled || !settingsML.googleEnabled)) {
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
    "google",
    `https://${hostML}/google/callback`
  );

  if (!clientIdML) {
    return new Response(
      "Google login isn't configured for this shop yet. Add a Google Client ID in the app's Client Settings page (or set GOOGLE_CLIENT_ID in .env).",
      { status: 500 }
    );
  }

  const googleURLML =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientIdML}` +
    `&redirect_uri=${encodeURIComponent(callbackUrlML)}` +
    `&response_type=code` +
    `&scope=email profile openid` +
    `&state=${encodeURIComponent(`${stateML}|${redirect_uriML}|${nonceML}`)}`;

  return Response.redirect(googleURLML);
}

export default function GoogleAuth() {
  return null;
}