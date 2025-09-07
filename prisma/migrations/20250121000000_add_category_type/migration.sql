-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('TEXT', 'IMAGE', 'PDF');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN "categoryType" "CategoryType" NOT NULL DEFAULT 'TEXT';

-- DropIndex
DROP INDEX "Category_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_categoryType_key" ON "Category"("name", "categoryType");
