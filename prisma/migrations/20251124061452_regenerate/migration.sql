-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('TEXT', 'IMAGE', 'PDF');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "pdfData" TEXT,
    "pdfFileName" TEXT,
    "pdfUrl" TEXT,
    "imageData" TEXT,
    "imageFileName" TEXT,
    "imageUrl" TEXT,
    "displayCategoryName" TEXT,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Container" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "top" DOUBLE PRECISION NOT NULL,
    "left" DOUBLE PRECISION NOT NULL,
    "noticeId" TEXT NOT NULL,

    CONSTRAINT "Container_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "editedName" TEXT,
    "icon" TEXT,
    "categoryType" "CategoryType" NOT NULL DEFAULT 'TEXT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dashboard" (
    "id" TEXT NOT NULL,
    "aspectRatio" TEXT NOT NULL,
    "containers" JSONB NOT NULL,
    "screenName" TEXT,
    "screenIndex" INTEGER,
    "totalScreens" INTEGER,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TempDashboard" (
    "id" TEXT NOT NULL,
    "aspectRatio" TEXT NOT NULL,
    "containers" JSONB NOT NULL,
    "screenName" TEXT,
    "screenIndex" INTEGER,
    "totalScreens" INTEGER,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "TempDashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "layout" JSONB NOT NULL,
    "name" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "widgetSettings" JSONB NOT NULL,
    "widgets" JSONB NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicNoticeSettings" (
    "id" TEXT NOT NULL,
    "logo" TEXT,
    "logoFileName" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Digital Notice Board',
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
    "fontColor" TEXT NOT NULL DEFAULT '#ffffff',

    CONSTRAINT "PublicNoticeSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicNoticeTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "logoFileName" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Digital Notice Board',
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
    "fontColor" TEXT NOT NULL DEFAULT '#ffffff',

    CONSTRAINT "PublicNoticeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pdf" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pdfData" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pdf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeratorPermission" (
    "id" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "allowedRoutes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeratorPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Container_noticeId_key" ON "Container"("noticeId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_categoryType_key" ON "Category"("name", "categoryType");

-- CreateIndex
CREATE UNIQUE INDEX "ModeratorPermission_moderatorId_key" ON "ModeratorPermission"("moderatorId");

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeratorPermission" ADD CONSTRAINT "ModeratorPermission_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
