-- CreateTable
CREATE TABLE "ModeratorPermission" (
    "id" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "allowedRoutes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeratorPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModeratorPermission_moderatorId_key" ON "ModeratorPermission"("moderatorId");

-- AddForeignKey
ALTER TABLE "ModeratorPermission" ADD CONSTRAINT "ModeratorPermission_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;






