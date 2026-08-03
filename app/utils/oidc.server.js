import { SignJWT } from "jose";
import { getKeys } from "./keys.server";

export async function createOIDCToken(user) {
  const { privateKey } = await getKeys();

  console.log("RUNTIME OIDC_ISSUER:", user.issuer);

  const token = await new SignJWT({
    email: user.email,
    email_verified: true,
    name: user.name,
    nonce: user.nonce,
  })
    .setProtectedHeader({
      alg: "RS256",
      kid: "shopify-login-key",
      typ: "JWT",
    })
    .setIssuer(user.issuer)
    .setAudience(user.client_id)
    .setSubject(user.id.toString())
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);

  return token;
}