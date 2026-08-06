import crypto from "crypto";
import { saveVerifier } from "../lib/twitterPkce.server";
import db from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);

  const state = url.searchParams.get("state");
  const redirect_uri = url.searchParams.get("redirect_uri");
  const nonce = url.searchParams.get("nonce");

  const shop = process.env.SHOP_DOMAIN;
  const settings = shop
    ? await db.shopSettings.findUnique({ where: { shop } })
    : null;

  if (settings && (!settings.appEnabled || !settings.twitterEnabled)) {
    const backToSelector =
      `/select-provider?` +
      `state=${encodeURIComponent(state || "")}` +
      `&redirect_uri=${encodeURIComponent(redirect_uri || "")}` +
      `&nonce=${encodeURIComponent(nonce || "")}`;
    return Response.redirect(new URL(backToSelector, url.origin));
  }

  const host = request.headers.get("x-forwarded-host") || url.host;
  const callbackUrl = `https://${host}/twitter/callback`;

  const codeVerifier = crypto.randomBytes(32).toString("hex");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const twitterState = `${state}|${redirect_uri}|${nonce}`;
  saveVerifier(state, codeVerifier);

  const twitterURL =
    `https://x.com/i/oauth2/authorize?` +
    new URLSearchParams({
      response_type: "code",
      client_id: process.env.X_CLIENT_ID,
      redirect_uri: callbackUrl,
      scope: "tweet.read users.read users.email offline.access",
      state: twitterState,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    }).toString();

  return Response.redirect(twitterURL);
}

export default function TwitterAuth() {
  return null;
}