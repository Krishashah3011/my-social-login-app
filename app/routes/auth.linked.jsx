import { redirect } from "react-router";
import db from "../db.server";
import { getProviderCredentialsML } from "../utils/providerCredentials.server";

export async function loader({ request: requestML }) {
  const urlML = new URL(requestML.url);

  const stateML = urlML.searchParams.get("state");
  const redirect_uriML = urlML.searchParams.get("redirect_uri");
  const nonceML = urlML.searchParams.get("nonce");

  const shopML = process.env.SHOP_DOMAIN;
  const settingsML = shopML
    ? await db.shopSettings.findUnique({ where: { shop: shopML } })
    : null;

  if (settingsML && (!settingsML.appEnabled || !settingsML.linkedinEnabled)) {
    const backToSelectorML =
      `/select-provider?` +
      `state=${encodeURIComponent(stateML || "")}` +
      `&redirect_uri=${encodeURIComponent(redirect_uriML || "")}` +
      `&nonce=${encodeURIComponent(nonceML || "")}`;
    return redirect(backToSelectorML);
  }

  const hostML =
    requestML.headers.get("x-forwarded-host") || urlML.host;

  const { clientId: clientIdML, callbackUrl: callbackUrlML } = getProviderCredentialsML(
    settingsML,
    "linkedin",
    `https://${hostML}/linked/callback`
  );

  const linkedURLML =
    "https://www.linkedin.com/oauth/v2/authorization?" +
    `client_id=${clientIdML}` +
    `&redirect_uri=${encodeURIComponent(callbackUrlML)}` +
    `&response_type=code` +
    `&scope=openid%20profile%20email` +
    `&prompt=login` +
    `&state=${encodeURIComponent(
      `${stateML}|${redirect_uriML}|${nonceML}`
    )}`;

  return redirect(linkedURLML);
}

export default function linkedAuth() {
  return null;
}