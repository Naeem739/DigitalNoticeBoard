/*
  Warnings:

  - You are about to drop the column `color` on the `Notice` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `Notice` table. All the data in the column will be lost.
  - You are about to drop the column `left` on the `Notice` table. All the data in the column will be lost.
  - You are about to drop the column `notice_id` on the `Notice` table. All the data in the column will be lost.
  - You are about to drop the column `top` on the `Notice` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `Notice` table. All the data in the column will be lost.
  - You are about to drop the `AllNotices` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `Notice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `Notice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `Notice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Notice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notice" DROP COLUMN "color",
DROP COLUMN "height",
DROP COLUMN "left",
DROP COLUMN "notice_id",
DROP COLUMN "top",
DROP COLUMN "width",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "title" TEXT NOT NULL;

-- DropTable
DROP TABLE "AllNotices";

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

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Container_noticeId_key" ON "Container"("noticeId");

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
