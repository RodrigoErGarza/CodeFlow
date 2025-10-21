-- DropForeignKey
ALTER TABLE "public"."Challenge" DROP CONSTRAINT "Challenge_lessonId_fkey";

-- AlterTable
ALTER TABLE "Challenge" ALTER COLUMN "lessonId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
