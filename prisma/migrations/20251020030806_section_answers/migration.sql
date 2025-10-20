/*
  Warnings:

  - You are about to drop the column `description` on the `Unit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Unit" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "UserSectionProgress" ADD COLUMN     "answersJson" TEXT;
