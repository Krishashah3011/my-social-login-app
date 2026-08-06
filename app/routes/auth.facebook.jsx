import db from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);

  const state = url.searchParams.get("state");
  const redirect_uri = url.searchParams.get("redirect_uri");
  const nonce = url.searchParams.get("nonce");

  // --- Server-side guard: block if Facebook is disabled for this shop ---
  const shop = process.env.SHOP_DOMAIN;
  const settings = shop
    ? await db.shopSettings.findUnique({ where: { shop } })
    : null;

  if (settings && (!settings.appEnabled || !settings.facebookEnabled)) {
    console.log("BLOCKED: Facebook login attempted while disabled");
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
    `https://${host}/facebook/callback`;

  console.log("FACEBOOK CALLBACK:", callbackUrl);
  console.log("STATE:", state);
  console.log("REDIRECT URI:", redirect_uri);
  console.log("NONCE:", nonce);

  const facebookURL =
    `https://www.facebook.com/v23.0/dialog/oauth?` +
    `client_id=${process.env.FACEBOOK_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
    `&response_type=code` +
    `&scope=email,public_profile` +
    `&state=${encodeURIComponent(
      `${state}|${redirect_uri}|${nonce}`
    )}`;

  console.log("FACEBOOK URL:");
  console.log(facebookURL);

  return Response.redirect(facebookURL);
}

export default function FacebookAuth() {
  return null;
}