-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_contributionId_fkey";

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
