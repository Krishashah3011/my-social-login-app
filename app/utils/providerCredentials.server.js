import db from "../db.server";

// Maps our internal provider key -> the legacy env var names used before
// merchants could enter their own Client ID / Secret in Client Settings.
const ENV_FALLBACKS_ML = {
  google: { clientId: "GOOGLE_CLIENT_ID", clientSecret: "GOOGLE_CLIENT_SECRET" },
  facebook: { clientId: "FACEBOOK_CLIENT_ID", clientSecret: "FACEBOOK_CLIENT_SECRET" },
  twitter: { clientId: "X_CLIENT_ID", clientSecret: "X_CLIENT_SECRET" },
  amazon: { clientId: "AMAZON_CLIENT_ID", clientSecret: "AMAZON_CLIENT_SECRET" },
  linkedin: { clientId: "linked_CLIENT_ID", clientSecret: "linked_CLIENT_SECRET" },
};

// Looks up the current shop's settings row (same pattern already used
// across the auth.*.jsx loaders — keyed off SHOP_DOMAIN).
export async function getShopSettingsML() {
  const shopML = process.env.SHOP_DOMAIN;
  return shopML ? await db.shopSettings.findUnique({ where: { shop: shopML } }) : null;
}

// Resolves { clientId, clientSecret, callbackUrl } for a provider.
// Order of precedence: merchant-entered value in Client Settings (DB) ->
// legacy env var (clientId/clientSecret only) -> defaultCallbackUrlML.
export function getProviderCredentialsML(settingsML, providerKeyML, defaultCallbackUrlML) {
  const envKeysML = ENV_FALLBACKS_ML[providerKeyML];

  return {
    clientId: settingsML?.[`${providerKeyML}ClientId`] || process.env[envKeysML.clientId],
    clientSecret: settingsML?.[`${providerKeyML}ClientSecret`] || process.env[envKeysML.clientSecret],
    callbackUrl: settingsML?.[`${providerKeyML}CallbackUrl`] || defaultCallbackUrlML,
  };
}
