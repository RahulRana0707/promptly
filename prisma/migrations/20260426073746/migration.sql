-- CreateTable
CREATE TABLE "Profile" (
    "userId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "DailyPlanDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planDate" DATE NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyPlanDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyPlanDay_userId_planDate_idx" ON "DailyPlanDay"("userId", "planDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "DailyPlanDay_userId_planDate_key" ON "DailyPlanDay"("userId", "planDate");

-- CreateIndex
CREATE INDEX "Article_userId_updatedAt_idx" ON "Article"("userId", "updatedAt" DESC);
