const { initializeApp } = require("firebase/app");
const { PrismaClient, Role } = require("@prisma/client");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const admZip = require("adm-zip");
const bucket = require("../utils/firebase");
const { downloadFile } = require("../utils/firebase");
const firebaseUtils = require("../utils/firebase");
const fs = require("fs");
const path = require("path");
const { sendMailToManager } = require("../utils/mail-service");
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
    const { sort, title } = req.query;

    const limit = 10;
    let offset = 0;
    let allMyContributions = [];
    const queryOptions = {
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
        Image: {
          select: {
            path: true,
          },
        },
      },
      take: limit,
      skip: offset,
    };

    if (title) { 
      queryOptions.where = {
        ...queryOptions.where,
        title: {
          contains: title,
          mode: "insensitive", // support case-insensitive filtering
        },
      };
    }

    if (sort) {
      queryOptions.orderBy = {
        createdAt: sort === "asc" ? "asc" : "desc",
      };
    }

    while (true) {
      const contributions = await prisma.contribution.findMany(queryOptions);

      if (contributions.length === 0) {
        break;
      }

      allMyContributions.push(contributions);
      offset += limit;
      queryOptions.skip = offset;
    }

    res.status(StatusCodes.OK).json({
      allMyContributions: allMyContributions,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

const chooseContribution = async (req, res) => {
  const { Id } = req.params;

  try {
    // Update contribution status to chosen
    const chosenContribution = await prisma.contribution.findFirst({
      where: { id: Id },
      //data: { is_choosen: true },
    });

    // Check if contribution with given Id is found
    if (!chosenContribution) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Contribution not found",
      });
    }

    if (chosenContribution.is_choosen === false) {
      const updatedContribution = await prisma.contribution.update({
        where: { id: Id },
        data: { is_choosen: true },
      });
      // Fetch contribution content
      const contributionContent = updatedContribution.title; // Adjust this based on your contribution data structure

      // Get the user ID who uploaded the contribution
      const userId = updatedContribution.userId;

      // Fetch user's faculty ID
      const userFaculty = await prisma.user.findUnique({
        where: { id: userId },
        select: { FacultyId: true },
      });

      // Fetch marketing managers of the user's faculty
      const marketingManagers = await prisma.user.findMany({
        where: {
          FacultyId: userFaculty.FacultyId,
          role: "MANAGER", // Assuming "MANAGER" is the role for marketing managers
        },
        select: { email: true },
      });

      // Send email notifications to marketing managers
      const notificationContent = `A new contribution has been chosen: "${contributionContent}"`;
      marketingManagers.forEach(async (manager) => {
        await sendMailToManager(manager.email, notificationContent);
      });

      // Create notification for the user
      await prisma.notification.create({
        data: {
          content: notificationContent,
          contributionId: Id,
          userId: userId,
        },
      });

      res.status(StatusCodes.OK).json({
        message: "Contribution chosen successfully",
        chosenContribution: updatedContribution,
      });
    } else {
      const updatedContribution = await prisma.contribution.update({
        where: { id: Id },
        data: { is_choosen: false },
      });
      res.status(StatusCodes.OK).json({
        message: "Contribution unchosen successfully",
        chosenContribution: updatedContribution,
      });
    }
  } catch (error) {
    console.error("Error choosing contribution:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to choose contribution",
    });
  }
};

const viewAllStudentInFaculty = async (req, res) => {
  const email = req.decodedPayload.data.email;
  const coordinator = await prisma.user.findFirst({
    where: { email: email },
  });

  const students = await prisma.user.findMany({
    where: { FacultyId: coordinator.FacultyId, role: Role.STUDENT },
  });

  res.status(StatusCodes.OK).json({
    students: students,
  });
};

module.exports = {
  viewContribution,
  chooseContribution,
  downloadContribution,
  viewAllStudentInFaculty,
};
