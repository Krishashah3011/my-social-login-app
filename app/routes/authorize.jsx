export async function loader({ request }) {
  const url = new URL(request.url);

  const client_id = url.searchParams.get("client_id");
  const redirect_uri = url.searchParams.get("redirect_uri");
  const state = url.searchParams.get("state");
  const nonce = url.searchParams.get("nonce");

  // Build callback URL dynamically from the incoming request — always correct, no .env dependency
  const host = request.headers.get("x-forwarded-host") || url.host;
  const callbackUrl = `https://${host}/google/callback`;

  console.log("OIDC CLIENT:", client_id);
  console.log("REDIRECT URI:", redirect_uri);
  console.log("STATE:", state);
  console.log("NONCE:", nonce);
  console.log("DYNAMIC CALLBACK:", callbackUrl);

  const googleURL =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
    `&response_type=code` +
    `&scope=email profile openid` +
    `&state=${encodeURIComponent(`${state}|${redirect_uri}|${nonce}`)}`;

  console.log("FINAL GOOGLE URL:");
  console.log(googleURL);

  return Response.redirect(googleURL);
}