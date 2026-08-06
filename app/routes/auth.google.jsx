import db from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);

  const state = url.searchParams.get("state");
  const redirect_uri = url.searchParams.get("redirect_uri");
  const nonce = url.searchParams.get("nonce");

  // --- Server-side guard: block if Google is disabled for this shop ---
  const shop = process.env.SHOP_DOMAIN;
  const settings = shop
    ? await db.shopSettings.findUnique({ where: { shop } })
    : null;

  if (settings && (!settings.appEnabled || !settings.googleEnabled)) {
    console.log("BLOCKED: Google login attempted while disabled");
    const backToSelector =
      `/select-provider?` +
      `state=${encodeURIComponent(state || "")}` +
      `&redirect_uri=${encodeURIComponent(redirect_uri || "")}` +
      `&nonce=${encodeURIComponent(nonce || "")}`;
    return Response.redirect(new URL(backToSelector, url.origin));
  }
  // --- end guard ---

  const host =
    request.headers.get("x-forwarded-host") || url.host;

  const callbackUrl =
    `https://${host}/google/callback`;

  console.log("GOOGLE CALLBACK:", callbackUrl);
  console.log("STATE:", state);
  console.log("REDIRECT URI:", redirect_uri);
  console.log("NONCE:", nonce);

  const googleURL =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
    `&response_type=code` +
    `&scope=email profile openid` +
    `&state=${encodeURIComponent(
      `${state}|${redirect_uri}|${nonce}`
    )}`;

  console.log("FINAL GOOGLE URL:");
  console.log(googleURL);

  return Response.redirect(googleURL);
}

export default function GoogleAuth() {
  return null;
}