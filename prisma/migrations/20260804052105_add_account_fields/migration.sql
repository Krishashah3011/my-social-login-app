/*
  Warnings:

  - You are about to drop the `PhoneOtp` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "ShopSettings" ADD COLUMN "accountEmail" TEXT;
ALTER TABLE "ShopSettings" ADD COLUMN "username" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PhoneOtp";
PRAGMA foreign_keys=on;
