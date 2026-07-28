/*
  Warnings:

  - Made the column `name` on table `GoogleUser` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GoogleUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profileImage" TEXT,
    "shopifyCustomerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GoogleUser" ("createdAt", "email", "googleId", "id", "name", "profileImage", "updatedAt") SELECT "createdAt", "email", "googleId", "id", "name", "profileImage", "updatedAt" FROM "GoogleUser";
DROP TABLE "GoogleUser";
ALTER TABLE "new_GoogleUser" RENAME TO "GoogleUser";
CREATE UNIQUE INDEX "GoogleUser_email_key" ON "GoogleUser"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
