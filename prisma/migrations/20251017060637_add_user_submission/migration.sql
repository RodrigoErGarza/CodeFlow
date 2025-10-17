-- CreateTable
CREATE TABLE "UserSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeSlug" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserSubmission_userId_challengeSlug_idx" ON "UserSubmission"("userId", "challengeSlug");
