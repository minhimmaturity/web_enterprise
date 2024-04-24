/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Faculty` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Faculty_name_key" ON "Faculty"("name");
