/*
  Warnings:

  - Added the required column `updatedAt` to the `UserProgress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserProgress" ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
