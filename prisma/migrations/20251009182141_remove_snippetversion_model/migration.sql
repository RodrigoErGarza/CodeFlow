/*
  Warnings:

  - You are about to drop the `SnippetVersion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Snippet" DROP CONSTRAINT "Snippet_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SnippetVersion" DROP CONSTRAINT "SnippetVersion_snippetId_fkey";

-- DropIndex
DROP INDEX "public"."Snippet_userId_idx";

-- AlterTable
ALTER TABLE "Snippet" ADD COLUMN     "snippetVersion" INTEGER NOT NULL DEFAULT 1;

-- DropTable
DROP TABLE "public"."SnippetVersion";

-- AddForeignKey
ALTER TABLE "Snippet" ADD CONSTRAINT "Snippet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
