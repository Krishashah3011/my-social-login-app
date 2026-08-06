import { redirect } from "react-router";
import db from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);

  const state = url.searchParams.get("state");
  const redirect_uri = url.searchParams.get("redirect_uri");
  const nonce = url.searchParams.get("nonce");

  // --- Server-side guard: block if LinkedIn is disabled for this shop ---
  const shop = process.env.SHOP_DOMAIN;
  const settings = shop
    ? await db.shopSettings.findUnique({ where: { shop } })
    : null;

  if (settings && (!settings.appEnabled || !settings.linkedinEnabled)) {
    console.log("BLOCKED: LinkedIn login attempted while disabled");
    const backToSelector =
      `/select-provider?` +
      `state=${encodeURIComponent(state || "")}` +
      `&redirect_uri=${encodeURIComponent(redirect_uri || "")}` +
      `&nonce=${encodeURIComponent(nonce || "")}`;
    return redirect(backToSelector);
  }
  // --- end guard ---

  const host =
    request.headers.get("x-forwarded-host") || url.host;

  const callbackUrl =
    `https://${host}/linked/callback`;

  const linkedURL =
    "https://www.linkedin.com/oauth/v2/authorization?" +
    `client_id=${process.env.linked_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
    `&response_type=code` +
    `&scope=openid%20profile%20email` +
    `&prompt=login` +
    `&state=${encodeURIComponent(
      `${state}|${redirect_uri}|${nonce}`
    )}`;

  console.log("linked URL:");
  console.log(linkedURL);

  return redirect(linkedURL);
}

export default function linkedAuth() {
  return null;
}