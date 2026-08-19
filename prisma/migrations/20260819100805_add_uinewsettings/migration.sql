-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShopSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "googleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "twitterEnabled" BOOLEAN NOT NULL DEFAULT true,
    "facebookEnabled" BOOLEAN NOT NULL DEFAULT true,
    "linkedinEnabled" BOOLEAN NOT NULL DEFAULT true,
    "amazonEnabled" BOOLEAN NOT NULL DEFAULT true,
    "appEnabled" BOOLEAN NOT NULL DEFAULT true,
    "serialKey" TEXT,
    "registered" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT,
    "accountEmail" TEXT,
    "googleLogo" TEXT,
    "twitterLogo" TEXT,
    "facebookLogo" TEXT,
    "linkedinLogo" TEXT,
    "amazonLogo" TEXT,
    "googleClientId" TEXT,
    "googleClientSecret" TEXT,
    "googleCallbackUrl" TEXT,
    "googleSortOrder" INTEGER NOT NULL DEFAULT 1,
    "facebookClientId" TEXT,
    "facebookClientSecret" TEXT,
    "facebookCallbackUrl" TEXT,
    "facebookSortOrder" INTEGER NOT NULL DEFAULT 3,
    "twitterClientId" TEXT,
    "twitterClientSecret" TEXT,
    "twitterCallbackUrl" TEXT,
    "twitterSortOrder" INTEGER NOT NULL DEFAULT 4,
    "amazonClientId" TEXT,
    "amazonClientSecret" TEXT,
    "amazonCallbackUrl" TEXT,
    "amazonSortOrder" INTEGER NOT NULL DEFAULT 5,
    "linkedinClientId" TEXT,
    "linkedinClientSecret" TEXT,
    "linkedinCallbackUrl" TEXT,
    "linkedinSortOrder" INTEGER NOT NULL DEFAULT 2,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ShopSettings" ("accountEmail", "amazonEnabled", "amazonLogo", "appEnabled", "createdAt", "facebookEnabled", "facebookLogo", "googleEnabled", "googleLogo", "id", "linkedinEnabled", "linkedinLogo", "registered", "serialKey", "shop", "twitterEnabled", "twitterLogo", "updatedAt", "username") SELECT "accountEmail", "amazonEnabled", "amazonLogo", "appEnabled", "createdAt", "facebookEnabled", "facebookLogo", "googleEnabled", "googleLogo", "id", "linkedinEnabled", "linkedinLogo", "registered", "serialKey", "shop", "twitterEnabled", "twitterLogo", "updatedAt", "username" FROM "ShopSettings";
DROP TABLE "ShopSettings";
ALTER TABLE "new_ShopSettings" RENAME TO "ShopSettings";
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");
CREATE UNIQUE INDEX "ShopSettings_serialKey_key" ON "ShopSettings"("serialKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
