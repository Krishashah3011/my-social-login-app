import { exportJWK } from "jose";
import { getKeys } from "../utils/keys.server";

export async function loader({ request }) {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || url.host;
  const baseUrl = `https://${host}`;

  if (url.pathname === "/.well-known/jwks.json") {
    const { publicKey } = await getKeys();
    const jwk = await exportJWK(publicKey);

    return Response.json({
      keys: [
        {
          ...jwk,
          kid: "shopify-login-key",
          use: "sig",
          alg: "RS256",
        },
      ],
    });
  }

  if (url.pathname === "/.well-known/openid-configuration") {
    return Response.json({
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/authorize`,
      token_endpoint: `${baseUrl}/token`,
      jwks_uri: `${baseUrl}/.well-known/jwks.json`,
      response_types_supported: ["code"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"],
      scopes_supported: ["openid", "email", "customer-account-api:full"],
      grant_types_supported: ["authorization_code"],
      token_endpoint_auth_methods_supported: ["client_secret_basic"],
    });
  }

  return new Response("Not found", { status: 404 });
}