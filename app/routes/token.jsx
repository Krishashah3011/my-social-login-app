import { getCode } from "../utils/authCodes.server";
import { createOIDCToken } from "../utils/oidc.server";

export async function action({ request }) {
  console.log("TOKEN ENDPOINT HIT");

  const body = await request.text();
  console.log("TOKEN BODY:", body);

  const params = new URLSearchParams(body);

  const code = params.get("code");
  let client_id = params.get("client_id");
  let client_secret = params.get("client_secret");

  // Fallback: check Authorization Basic header if not in body
  const authHeader = request.headers.get("authorization");
  console.log("AUTH HEADER:", authHeader);

  console.log("EXPECTED CLIENT:", process.env.OIDC_CLIENT_ID);
  console.log("EXPECTED SECRET:", process.env.OIDC_CLIENT_SECRET);

  if (!client_id && authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
    const [headerClientId, headerClientSecret] = decoded.split(":");
    client_id = headerClientId;
    client_secret = headerClientSecret;
  }

  console.log("AUTH CODE:", code);
  console.log("CLIENT ID:", client_id);

  if (
    client_id !== process.env.OIDC_CLIENT_ID ||
    client_secret !== process.env.OIDC_CLIENT_SECRET
  ) {
    console.log("INVALID CLIENT CREDENTIALS");
    return new Response("Invalid client credentials", { status: 401 });
  }

  if (!code) {
    return new Response("Missing authorization code", { status: 400 });
  }

  const user = getCode(code);
  console.log("USER FROM CODE:", user);

  if (!user) {
    return new Response("Invalid or expired code", { status: 400 });
  }

  const id_token = await createOIDCToken({
    email: user.email,
    name: user.name,
    id: user.id,
    nonce: user.nonce,
  });

  console.log("ID TOKEN CREATED");

  // Decode and log the token payload so we can see exactly what claims it contains
  const [, payloadB64] = id_token.split(".");
  const decodedPayload = JSON.parse(Buffer.from(payloadB64, "base64").toString());
  console.log("DECODED ID TOKEN PAYLOAD:", decodedPayload);

  const responseBody = {
    access_token: id_token,
    token_type: "Bearer",
    expires_in: 300,
    id_token,
    scope: "openid email",
  };

console.log("FINAL TOKEN RESPONSE:", JSON.stringify(responseBody, null, 2));

console.log("RETURNING JSON NOW");

return new Response(JSON.stringify(responseBody), {
  status: 200,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  },
});
}

console.log("RESPONSE HEADERS:", {
  "content-type": "application/json",
  "cache-control": "no-store",
});

export default function Token() {
  return null;
}