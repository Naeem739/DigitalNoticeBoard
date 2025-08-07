/*
  Warnings:

  - You are about to drop the column `noticeType` on the `Notice` table. All the data in the column will be lost.
  - Made the column `content` on table `Notice` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Notice" DROP COLUMN "noticeType",
ALTER COLUMN "content" SET NOT NULL;

-- CreateTable
CREATE TABLE "PublicNoticeSettings" (
    "id" TEXT NOT NULL,
    "logo" TEXT,
    "logoFileName" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Smart Notice Board',
    "subtitle" TEXT NOT NULL DEFAULT 'Information Technology Department',
    "emergencyNumber" TEXT NOT NULL DEFAULT '01734528367',
    "emergencyContact" TEXT NOT NULL DEFAULT 'Md. Rashid Al Asif',
    "departmentName" TEXT NOT NULL DEFAULT 'Information Technology Department',
    "backgroundType" TEXT NOT NULL DEFAULT 'gradient',
    "backgroundColor" TEXT,
    "gradientColors" JSONB,
    "backgroundImage" TEXT,
    "backgroundImageFileName" TEXT,
    "headerBackgroundColor" TEXT NOT NULL DEFAULT '#1e293b',
    "footerBackgroundColor" TEXT NOT NULL DEFAULT '#1e293b',
    "accentColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicNoticeSettings_pkey" PRIMARY KEY ("id")
);
