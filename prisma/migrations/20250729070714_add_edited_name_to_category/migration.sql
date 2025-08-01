/*
  Warnings:

  - You are about to drop the column `icon` on the `Notice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "editedName" TEXT;

-- AlterTable
ALTER TABLE "Notice" DROP COLUMN "icon";
