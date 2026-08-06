import db from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);

  const state = url.searchParams.get("state");
  const redirect_uri = url.searchParams.get("redirect_uri");
  const nonce = url.searchParams.get("nonce");

  // --- Server-side guard: block if Amazon is disabled for this shop ---
  const shop = process.env.SHOP_DOMAIN;
  const settings = shop
    ? await db.shopSettings.findUnique({ where: { shop } })
    : null;

  if (settings && !settings.amazonEnabled) {
    console.log("BLOCKED: Amazon login attempted while disabled");
    const backToSelector =
      `/select-provider?` +
      `state=${encodeURIComponent(state || "")}` +
      `&redirect_uri=${encodeURIComponent(redirect_uri || "")}` +
      `&nonce=${encodeURIComponent(nonce || "")}`;
    return Response.redirect(new URL(backToSelector, url.origin));
  }
  // --- end guard ---

  const host = request.headers.get("x-forwarded-host") || url.host;
  const callbackUrl = `https://${host}/amazon/callback`;

  console.log("AMAZON CALLBACK:", callbackUrl);
  console.log("STATE:", state);
  console.log("REDIRECT URI:", redirect_uri);
  console.log("NONCE:", nonce);

  const amazonURL =
    `https://www.amazon.com/ap/oa?` +
    `client_id=${process.env.AMAZON_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
    `&response_type=code` +
    `&scope=profile` +
    `&state=${encodeURIComponent(`${state}|${redirect_uri}|${nonce}`)}`;

  console.log("FINAL AMAZON URL:");
  console.log(amazonURL);

  return Response.redirect(amazonURL);
}

export default function AmazonAuth() {
  return null;
}