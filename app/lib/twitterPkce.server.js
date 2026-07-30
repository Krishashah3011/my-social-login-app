const verifierStore = new Map();

export function saveVerifier(state, codeVerifier) {
  verifierStore.set(state, codeVerifier);
}

export function getVerifier(state) {
  const verifier = verifierStore.get(state);
  verifierStore.delete(state);
  return verifier;
}