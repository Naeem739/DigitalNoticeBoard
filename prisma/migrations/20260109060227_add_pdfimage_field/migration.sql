/*
  Warnings:

  - You are about to drop the column `pdfPreviewImageData` on the `Notice` table. All the data in the column will be lost.
  - You are about to drop the column `pdfPreviewImageData` on the `Pdf` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Notice" DROP COLUMN "pdfPreviewImageData",
ADD COLUMN     "pdfimage" TEXT;

-- AlterTable
ALTER TABLE "Pdf" DROP COLUMN "pdfPreviewImageData";
