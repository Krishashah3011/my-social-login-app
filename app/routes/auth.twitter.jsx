import crypto from "crypto";
import { saveVerifier } from "../lib/twitterPkce.server";

export async function loader({ request }) {
  const url = new URL(request.url);

  const state = url.searchParams.get("state");
  const redirect_uri = url.searchParams.get("redirect_uri");
  const nonce = url.searchParams.get("nonce");

  const host = request.headers.get("x-forwarded-host") || url.host;
  const callbackUrl = `https://${host}/twitter/callback`;

  console.log("========== TWITTER OAUTH START ==========");
  console.log("X CLIENT ID:", process.env.X_CLIENT_ID);
  console.log("TWITTER CALLBACK URL:", callbackUrl);
  console.log("SHOPIFY STATE:", state);
  console.log("SHOPIFY REDIRECT URI:", redirect_uri);
  console.log("NONCE:", nonce);

  const codeVerifier = crypto.randomBytes(32).toString("hex");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  console.log("PKCE VERIFIER:", codeVerifier);
  console.log("PKCE CHALLENGE:", codeChallenge);
  console.log("PKCE METHOD: S256");

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

  console.log("TWITTER AUTH URL:");
  console.log(twitterURL);
  console.log("========== TWITTER OAUTH END ==========");

  return Response.redirect(twitterURL);
}

export default function TwitterAuth() {
  return null;
}