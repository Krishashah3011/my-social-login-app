import { exportJWK } from "jose";
import { getKeys } from "../utils/keys.server";

export async function loader({ request: requestML }) {
  const urlML = new URL(requestML.url);
  const hostML = requestML.headers.get("x-forwarded-host") || urlML.host;
  const baseUrlML = `https://${hostML}`;

  if (urlML.pathname === "/.well-known/jwks.json") {
    const { publicKey: publicKeyML } = await getKeys();
    const jwkML = await exportJWK(publicKeyML);

    return Response.json({
      keys: [
        {
          ...jwkML,
          kid: "shopify-login-key",
          use: "sig",
          alg: "RS256",
        },
      ],
    });
  }

  if (urlML.pathname === "/.well-known/openid-configuration") {
    return Response.json({
      issuer: baseUrlML,
      authorization_endpoint: `${baseUrlML}/authorize`,
      token_endpoint: `${baseUrlML}/token`,
      jwks_uri: `${baseUrlML}/.well-known/jwks.json`,
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