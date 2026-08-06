import { generateKeyPair, exportJWK } from "jose";

let keyPairML;

export async function getKeys() {

  if (keyPairML) {
    return keyPairML;
  }

  const { privateKey: privateKeyML, publicKey: publicKeyML } =
    await generateKeyPair("RS256");

  keyPairML = {
    privateKey: privateKeyML,
    publicKey: publicKeyML,
  };
  return keyPairML;
}

export async function getPublicJWK() {
  const { publicKey: publicKeyML } = await getKeys();
  const jwkML = await exportJWK(publicKeyML);

  return {
    ...jwkML,
    kid: "shopify-login-key",
    use: "sig",
    alg: "RS256",
  };
}