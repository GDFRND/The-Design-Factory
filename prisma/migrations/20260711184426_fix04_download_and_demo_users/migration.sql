-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "downloadedAt" TIMESTAMP(3),
ADD COLUMN     "finalKey" TEXT;
