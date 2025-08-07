-- AlterTable
ALTER TABLE "Notice" ADD COLUMN     "noticeType" TEXT NOT NULL DEFAULT 'text',
ALTER COLUMN "content" DROP NOT NULL;
