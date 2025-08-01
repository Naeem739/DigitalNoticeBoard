/*
  Warnings:

  - You are about to drop the column `icon` on the `Notice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Notice" DROP COLUMN "icon";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
