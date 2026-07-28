import { generateKeyPair, exportJWK } from "jose";

let keyPair;

export async function getKeys() {

  if (keyPair) {
    return keyPair;
  }

  const { privateKey, publicKey } =
    await generateKeyPair("RS256");

  keyPair = {
    privateKey,
    publicKey,
  };
  return keyPair;
}

export async function getPublicJWK() {
  const { publicKey } = await getKeys();
  const jwk = await exportJWK(publicKey);

  return {
    ...jwk,
    kid: "shopify-login-key",
    use: "sig",
    alg: "RS256",
  };
}