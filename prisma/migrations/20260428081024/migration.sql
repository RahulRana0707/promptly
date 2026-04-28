-- CreateTable
CREATE TABLE "ShortsProject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShortsProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShortsProject_userId_updatedAt_idx" ON "ShortsProject"("userId", "updatedAt" DESC);
