import crypto from "crypto";
import { saveVerifier } from "../lib/twitterPkce.server";
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

  if (settingsML && (!settingsML.appEnabled || !settingsML.twitterEnabled)) {
    const backToSelectorML =
      `/select-provider?` +
      `state=${encodeURIComponent(stateML || "")}` +
      `&redirect_uri=${encodeURIComponent(redirect_uriML || "")}` +
      `&nonce=${encodeURIComponent(nonceML || "")}`;
    return Response.redirect(new URL(backToSelectorML, urlML.origin));
  }

  const hostML = requestML.headers.get("x-forwarded-host") || urlML.host;
  const callbackUrlML = `https://${hostML}/twitter/callback`;

  const codeVerifierML = crypto.randomBytes(32).toString("hex");
  const codeChallengeML = crypto
    .createHash("sha256")
    .update(codeVerifierML)
    .digest("base64url");

  const twitterStateML = `${stateML}|${redirect_uriML}|${nonceML}`;
  saveVerifier(stateML, codeVerifierML);

  const twitterURLML =
    `https://x.com/i/oauth2/authorize?` +
    new URLSearchParams({
      response_type: "code",
      client_id: process.env.X_CLIENT_ID,
      redirect_uri: callbackUrlML,
      scope: "tweet.read users.read users.email offline.access",
      state: twitterStateML,
      code_challenge: codeChallengeML,
      code_challenge_method: "S256",
    }).toString();

  return Response.redirect(twitterURLML);
}

export default function TwitterAuth() {
  return null;
}