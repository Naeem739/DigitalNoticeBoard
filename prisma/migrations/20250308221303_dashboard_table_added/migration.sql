-- AlterTable
ALTER TABLE "Notice" ALTER COLUMN "createdAt" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Dashboard" (
    "id" TEXT NOT NULL,
    "aspectRatio" TEXT NOT NULL,
    "containers" JSONB NOT NULL,

    CONSTRAINT "Dashboard_pkey" PRIMARY KEY ("id")
);
