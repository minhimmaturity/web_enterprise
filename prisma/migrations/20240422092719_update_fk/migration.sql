-- DropForeignKey
ALTER TABLE "Faculty" DROP CONSTRAINT "Faculty_createBy_fkey";

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_createBy_fkey" FOREIGN KEY ("createBy") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
