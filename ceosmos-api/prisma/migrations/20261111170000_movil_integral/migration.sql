-- CreateEnum
CREATE TYPE "FocusMode" AS ENUM ('FOCUS', 'RELAX', 'INSPIRE');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('WEARABLE', 'TV');

-- CreateEnum
CREATE TYPE "DeviceTransport" AS ENUM ('TCP', 'BLE');

-- CreateTable
CREATE TABLE "FocusSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentKey" TEXT NOT NULL,
    "mode" "FocusMode" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "targetMinutes" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FocusSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DeviceType" NOT NULL,
    "transport" "DeviceTransport" NOT NULL DEFAULT 'TCP',
    "address" TEXT NOT NULL,
    "configuration" JSONB,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FocusSession_userId_startedAt_idx" ON "FocusSession"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_contentKey_key" ON "Favorite"("userId", "contentKey");

-- CreateIndex
CREATE INDEX "LinkedDevice_userId_idx" ON "LinkedDevice"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedDevice_userId_type_address_key" ON "LinkedDevice"("userId", "type", "address");

-- AddForeignKey
ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedDevice" ADD CONSTRAINT "LinkedDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Invariantes en la base de datos (Prisma no las modela).
ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_valores_check"
  CHECK ("durationSeconds" >= 0
         AND "targetMinutes" BETWEEN 5 AND 180
         AND "durationSeconds" <= "targetMinutes" * 60
         AND "endedAt" >= "startedAt");
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_contentKey_check"
  CHECK (char_length("contentKey") BETWEEN 1 AND 80);
ALTER TABLE "LinkedDevice" ADD CONSTRAINT "LinkedDevice_texto_check"
  CHECK (char_length("name") BETWEEN 1 AND 40 AND char_length("address") BETWEEN 3 AND 80);
