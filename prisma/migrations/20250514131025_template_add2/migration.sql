/*
  Warnings:

  - You are about to drop the column `aspectRatio` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the column `containers` on the `Template` table. All the data in the column will be lost.
  - Added the required column `layout` to the `Template` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Template` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Template` table without a default value. This is not possible if the table is not empty.
  - Added the required column `widgetSettings` to the `Template` table without a default value. This is not possible if the table is not empty.
  - Added the required column `widgets` to the `Template` table without a default value. This is not possible if the table is not empty.
  - Made the column `createdAt` on table `Template` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Template" DROP COLUMN "aspectRatio",
DROP COLUMN "containers",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "layout" JSONB NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "widgetSettings" JSONB NOT NULL,
ADD COLUMN     "widgets" JSONB NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL;
