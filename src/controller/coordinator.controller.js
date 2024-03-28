const { PrismaClient, Role } = require("@prisma/client");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const {sendMailToManager }= require("../utils/mail-service")

const prisma = new PrismaClient();

dotenv.config();

const viewContribution = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
          where: { email: req.decodedPayload.data.email },
        });
    
        if (!user) {
          return res.status(StatusCodes.NOT_FOUND).json({
            message: "User not found",
          });
        }
    
        const limit = 10;
        let offset = 0;
        let allMyContributions = [];
    
        while (true) {
          const contributions = await prisma.contribution.findMany({
            where: {
                user: {
                  FacultyId: user.FacultyId,
                },
            },
            include: {
              AcademicYear: { 
                select: {
                  closure_date: true,
                  final_closure_date: true,
                },
              },
            },
            skip: offset,
            take: limit,
          });
          
          if (contributions.length === 0) {
            break;
          }
    
          allMyContributions.push(contributions);
          offset += limit;
        }
    
        res.status(StatusCodes.OK).json({
          contribution: allMyContributions,
        });
      } catch (error) {
        console.error(error);
        res.status(StatusCodes.BAD_GATEWAY).json({
          message: "Internal Server Error",
        });
      }
}
const chooseContribution = async (req, res) => {
  const { Id } = req.params;

  try {
    const chosenContribution = await prisma.contribution.update({
      where: { id: Id },
      data: { is_choosen: true },
    });

    // Fetch contribution content
    const contributionContent = chosenContribution.title; // Adjust this based on your contribution data structure

    // Get the user ID who uploaded the contribution
    const userId = chosenContribution.userId;

    // Send notification to marketing managers
    await sendNotification(Id, userId, contributionContent);

    res.status(StatusCodes.OK).json({
      message: "Choose contribution successfully",
      chosenContribution,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

const sendNotification = async (contributionId, userId, content) => {
  try {
    // Fetch user's faculty ID
    const userFaculty = await prisma.user.findUnique({
      where: { id: userId },
      select: { FacultyId: true },
    });

    // Fetch marketing managers of the user's faculty

const marketingManagers = await prisma.user.findMany({
  where: {
    role: "MANAGER", // Assuming "MANAGER" is the role for marketing managers
  },
  select: { email: true },
});

// Log email addresses of marketing managers
marketingManagers.forEach((manager) => {
  console.log(manager.email);
});

    // Send email notifications to marketing managers
    const notificationContent = `A new contribution has been chosen: "${content}"`;
    marketingManagers.forEach(async (manager) => {
      await sendMailToManager(manager.email, notificationContent);
    });

    console.log(`Notification sent: ${content}`);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

module.exports = {viewContribution,chooseContribution}