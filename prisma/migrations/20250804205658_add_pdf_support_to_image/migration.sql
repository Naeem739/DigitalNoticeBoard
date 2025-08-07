/*
  Warnings:

  - Added the required column `fileType` to the `Image` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "fileType" TEXT NOT NULL,
ADD COLUMN     "pdfData" TEXT,
ADD COLUMN     "pdfUrl" TEXT,
ALTER COLUMN "imageUrl" DROP NOT NULL,
ALTER COLUMN "imageData" DROP NOT NULL;
