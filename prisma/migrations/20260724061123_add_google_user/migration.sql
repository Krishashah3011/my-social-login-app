-- CreateTable
CREATE TABLE "GoogleUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "profileImage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleUser_googleId_key" ON "GoogleUser"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleUser_email_key" ON "GoogleUser"("email");
