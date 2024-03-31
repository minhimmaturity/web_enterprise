-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_FacultyId_fkey";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_FacultyId_fkey" FOREIGN KEY ("FacultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
