import db from "../db.server";

const ENV_FALLBACKS_ML = {
  google: { clientId: "GOOGLE_CLIENT_ID", clientSecret: "GOOGLE_CLIENT_SECRET" },
  facebook: { clientId: "FACEBOOK_CLIENT_ID", clientSecret: "FACEBOOK_CLIENT_SECRET" },
  twitter: { clientId: "X_CLIENT_ID", clientSecret: "X_CLIENT_SECRET" },
  amazon: { clientId: "AMAZON_CLIENT_ID", clientSecret: "AMAZON_CLIENT_SECRET" },
  linkedin: { clientId: "linked_CLIENT_ID", clientSecret: "linked_CLIENT_SECRET" },
};

export async function getShopSettingsML(shopML) {
  if (shopML) {
    const settingsML = await db.shopSettings.findUnique({ where: { shop: shopML } });

    if (!settingsML) {
      console.error(
        `[providerCredentials] No ShopSettings row found for shop "${shopML}". ` +
          `Make sure this exactly matches the shop domain saved when you filled in Client Settings ` +
          `in the embedded admin app (case-sensitive, e.g. "your-store.myshopify.com").`
      );
    }

    return settingsML;
  }

  const settingsML = await db.shopSettings.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!settingsML) {
    console.error(
      "[providerCredentials] No ShopSettings rows exist yet. Install the app on a store and " +
        "open its Settings or Account page once so a row gets created."
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