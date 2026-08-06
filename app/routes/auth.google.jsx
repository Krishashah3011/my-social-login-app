import db from "../db.server";

export async function loader({ request: requestML }) {
  const urlML = new URL(requestML.url);

  const stateML = urlML.searchParams.get("state");
  const redirect_uriML = urlML.searchParams.get("redirect_uri");
  const nonceML = urlML.searchParams.get("nonce");

  const shopML = process.env.SHOP_DOMAIN;
  const settingsML = shopML
    ? await db.shopSettings.findUnique({ where: { shop: shopML } })
    : null;

  if (settingsML && (!settingsML.appEnabled || !settingsML.googleEnabled)) {
    const backToSelectorML =
      `/select-provider?` +
      `state=${encodeURIComponent(stateML || "")}` +
      `&redirect_uri=${encodeURIComponent(redirect_uriML || "")}` +
      `&nonce=${encodeURIComponent(nonceML || "")}`;
    return Response.redirect(new URL(backToSelectorML, urlML.origin));
  }

  const hostML =
    requestML.headers.get("x-forwarded-host") || urlML.host;

  const callbackUrlML =
    `https://${hostML}/google/callback`;

  const googleURLML =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(callbackUrlML)}` +
    `&response_type=code` +
    `&scope=email profile openid` +
    `&state=${encodeURIComponent(
      `${stateML}|${redirect_uriML}|${nonceML}`
    )}`;

  return Response.redirect(googleURLML);
}

export default function GoogleAuth() {
  return null;
}