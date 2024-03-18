/*
  Warnings:

  - You are about to drop the column `close_date` on the `Contribution` table. All the data in the column will be lost.
  - You are about to drop the column `facultyId` on the `Contribution` table. All the data in the column will be lost.
  - Added the required column `AcademicYearId` to the `Contribution` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_contributionId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Contribution" DROP CONSTRAINT "Contribution_facultyId_fkey";

-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_contributionId_fkey";

-- AlterTable
ALTER TABLE "Contribution" DROP COLUMN "close_date",
DROP COLUMN "facultyId",
ADD COLUMN     "AcademicYearId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_AcademicYearId_fkey" FOREIGN KEY ("AcademicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
