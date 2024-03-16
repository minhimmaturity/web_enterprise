/*
  Warnings:

  - Added the required column `FacultyId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "FacultyId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_FacultyId_fkey" FOREIGN KEY ("FacultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
