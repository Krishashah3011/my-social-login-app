import { authenticate } from "../shopify.server";
const cacheML = new WeakMap();

export function authenticateAdminOnceML(requestML) {
  if (!cacheML.has(requestML)) {
    cacheML.set(requestML, authenticate.admin(requestML));
  }
  return cacheML.get(requestML);
}