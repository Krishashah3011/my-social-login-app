const verifierStoreML = new Map();

export function saveVerifier(stateML, codeVerifierML) {
  verifierStoreML.set(stateML, codeVerifierML);
}

export function getVerifier(stateML) {
  const verifierML = verifierStoreML.get(stateML);
  verifierStoreML.delete(stateML);
  return verifierML;
}