/*
  Warnings:

  - You are about to drop the column `imageData` on the `Notice` table. All the data in the column will be lost.
  - You are about to drop the column `pdfData` on the `Notice` table. All the data in the column will be lost.
  - You are about to drop the column `pdfimage` on the `Notice` table. All the data in the column will be lost.
  - You are about to drop the column `pdfData` on the `Pdf` table. All the data in the column will be lost.
  - Added the required column `pdfUrl` to the `Pdf` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notice" DROP COLUMN "imageData",
DROP COLUMN "pdfData",
DROP COLUMN "pdfimage";

-- AlterTable
ALTER TABLE "Pdf" DROP COLUMN "pdfData",
ADD COLUMN     "pdfUrl" TEXT NOT NULL;
