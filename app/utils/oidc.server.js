import { SignJWT } from "jose";
import { getKeys } from "./keys.server";

export async function createOIDCToken(userML) {
  const { privateKey: privateKeyML } = await getKeys();

  const tokenML = await new SignJWT({
    email: userML.email,
    email_verified: true,
    name: userML.name,
    nonce: userML.nonce,
  })
    .setProtectedHeader({
      alg: "RS256",
      kid: "shopify-login-key",
      typ: "JWT",
    })
    .setIssuer(userML.issuer)
    .setAudience(userML.client_id)
    .setSubject(userML.id.toString())
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKeyML);

  return tokenML;
}