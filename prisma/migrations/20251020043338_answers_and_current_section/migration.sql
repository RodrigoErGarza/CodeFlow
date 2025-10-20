-- AlterTable
ALTER TABLE "UserUnitProgress" ADD COLUMN     "currentSectionIdx" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAnswer_userId_questionId_key" ON "UserAnswer"("userId", "questionId");
