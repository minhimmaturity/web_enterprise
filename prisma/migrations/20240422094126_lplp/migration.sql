-- DropForeignKey
ALTER TABLE "UserOnConservation" DROP CONSTRAINT "UserOnConservation_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "UserOnConservation" DROP CONSTRAINT "UserOnConservation_userId_fkey";

-- AddForeignKey
ALTER TABLE "UserOnConservation" ADD CONSTRAINT "UserOnConservation_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOnConservation" ADD CONSTRAINT "UserOnConservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
