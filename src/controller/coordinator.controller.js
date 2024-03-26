const { PrismaClient, Role } = require("@prisma/client");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

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
const chooseContribution = async (req,res) => {
  const { Id } = req.params;

  try {
    const chosenContribution = await prisma.contribution.update({
      where: { id: Id },
      data: {  is_choosen: true },
    });

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
}
module.exports = {viewContribution,chooseContribution}