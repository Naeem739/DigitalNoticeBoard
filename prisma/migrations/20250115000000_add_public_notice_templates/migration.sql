-- CreateTable
CREATE TABLE "PublicNoticeTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "logoFileName" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Smart Notice Board',
    "subtitle" TEXT NOT NULL DEFAULT 'Information Technology Department',
    "emergencyNumber" TEXT NOT NULL DEFAULT '01734528367',
    "emergencyContact" TEXT NOT NULL DEFAULT 'Md. Rashid Al Asif',
    "departmentName" TEXT NOT NULL DEFAULT 'Information Technology Department',
    "backgroundType" TEXT NOT NULL DEFAULT 'gradient',
    "backgroundColor" TEXT,
    "gradientColors" JSON,
    "backgroundImage" TEXT,
    "backgroundImageFileName" TEXT,
    "headerBackgroundColor" TEXT NOT NULL DEFAULT '#1e293b',
    "footerBackgroundColor" TEXT NOT NULL DEFAULT '#1e293b',
    "accentColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicNoticeTemplate_pkey" PRIMARY KEY ("id")
); 