import db from "../db.server";

const ENV_FALLBACKS_ML = {
  google: { clientId: "GOOGLE_CLIENT_ID", clientSecret: "GOOGLE_CLIENT_SECRET" },
  facebook: { clientId: "FACEBOOK_CLIENT_ID", clientSecret: "FACEBOOK_CLIENT_SECRET" },
  twitter: { clientId: "X_CLIENT_ID", clientSecret: "X_CLIENT_SECRET" },
  amazon: { clientId: "AMAZON_CLIENT_ID", clientSecret: "AMAZON_CLIENT_SECRET" },
  linkedin: { clientId: "linked_CLIENT_ID", clientSecret: "linked_CLIENT_SECRET" },
};

export async function getShopSettingsML(shopML) {
  const resolvedShopML = shopML || process.env.SHOP_DOMAIN;

  if (!resolvedShopML) {
    console.error(
      "[providerCredentials] No shop resolved — pass a shop explicitly or set SHOP_DOMAIN in .env."
    );
    return null;
  }

  const settingsML = await db.shopSettings.findUnique({ where: { shop: resolvedShopML } });

  if (!settingsML) {
    console.error(
      `[providerCredentials] No ShopSettings row found for shop "${resolvedShopML}". ` +
        `Make sure this exactly matches the shop domain saved when you filled in Client Settings ` +
        `in the embedded admin app (case-sensitive, e.g. "your-store.myshopify.com").`
    );
  }

  return settingsML;
}

export function getProviderCredentialsML(settingsML, providerKeyML, defaultCallbackUrlML) {
  const envKeysML = ENV_FALLBACKS_ML[providerKeyML];

  const clientIdML = settingsML?.[`${providerKeyML}ClientId`] || process.env[envKeysML.clientId];
  const clientSecretML =
    settingsML?.[`${providerKeyML}ClientSecret`] || process.env[envKeysML.clientSecret];

  if (!clientIdML) {
    console.error(
      `[providerCredentials] No Client ID for "${providerKeyML}" — checked ` +
        `ShopSettings.${providerKeyML}ClientId and env.${envKeysML.clientId}, both empty.`
    );
  }

  return {
    clientId: clientIdML,
    clientSecret: clientSecretML,
    callbackUrl: settingsML?.[`${providerKeyML}CallbackUrl`] || defaultCallbackUrlML,
  };
}