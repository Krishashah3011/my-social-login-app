import { redirect } from "react-router";

export async function loader({ request }) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  const host = new URL(request.url).host;

  const redirectUri = `https://${host}/google/callback`;

  const googleAuthUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
    });

  return redirect(googleAuthUrl);
}