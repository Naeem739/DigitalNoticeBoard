-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "aspectRatio" TEXT NOT NULL,
    "containers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);
