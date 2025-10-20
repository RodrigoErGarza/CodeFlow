/*
  Warnings:

  - A unique constraint covering the columns `[questionId,label]` on the table `Option` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sectionId,prompt]` on the table `Question` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Question" ALTER COLUMN "answerKey" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Option_questionId_label_key" ON "Option"("questionId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "Question_sectionId_prompt_key" ON "Question"("sectionId", "prompt");
