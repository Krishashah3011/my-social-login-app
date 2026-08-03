-- CreateTable
CREATE TABLE "amazonUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amazonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "shopifyCustomerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "amazonUser_email_key" ON "amazonUser"("email");
