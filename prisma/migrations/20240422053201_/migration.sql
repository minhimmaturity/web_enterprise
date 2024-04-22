-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'GUEST';

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_FacultyId_fkey";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_FacultyId_fkey" FOREIGN KEY ("FacultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
