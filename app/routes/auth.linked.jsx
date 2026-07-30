import { redirect } from "react-router";

export async function loader({ request }) {
  const url = new URL(request.url);

  const state = url.searchParams.get("state");
  const redirect_uri = url.searchParams.get("redirect_uri");
  const nonce = url.searchParams.get("nonce");

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