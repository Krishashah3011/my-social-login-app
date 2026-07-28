import { SignJWT } from "jose";
import { getKeys } from "./keys.server";

export async function createOIDCToken(user) {
  const { privateKey } = await getKeys();

  console.log("RUNTIME OIDC_ISSUER:", process.env.OIDC_ISSUER);

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
    .setIssuer("https://luck-thinking-flex-recorders.trycloudflare.com")
    .setAudience(process.env.OIDC_CLIENT_ID)
    .setSubject(user.id.toString())
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);

  return token;
}