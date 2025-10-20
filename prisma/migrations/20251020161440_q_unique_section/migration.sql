/*
  Warnings:

  - A unique constraint covering the columns `[unitId,index]` on the table `Section` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Section_unitId_index_key" ON "Section"("unitId", "index");
