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
    const { sort } = req.query;
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
    if (chosenContribution.is_choosen === false) {
      const chosenContribution = await prisma.contribution.update({
        where: { id: Id },
        data: { is_choosen: true },
      });
      // Fetch contribution content
      const contributionContent = chosenContribution.title; // Adjust this based on your contribution data structure

      // Get the user ID who uploaded the contribution
      const userId = chosenContribution.userId;

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
        chosenContribution,
      });
    } else {
      const chosenContribution = await prisma.contribution.update({
        where: { id: Id },
        data: { is_choosen: false },
      });
      res.status(StatusCodes.OK).json({
        message: "Contribution unchosen successfully",
        chosenContribution,
      });
    }
  } catch (error) {
    console.error("Error choosing contribution:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to choose contribution",
    });
  }
};

const downloadContribution = async (req, res) => {
  try {
    const zip = new admZip();
    const currentYear = new Date().getFullYear();

    const academicYear = await prisma.academicYear.findFirst({
      where: {
        final_closure_date: {
          gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        },
      },
    });

    const user = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const contributions = await prisma.contribution.findMany({
      where: {
        AcademicYearId: academicYear.id,
        user: {
          FacultyId: user.FacultyId,
        },
      },
    });

    if (contributions.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Empty list",
      });
    }

    for (const contribution of contributions) {
      const images = await prisma.image.findMany({
        where: { contributionId: contribution.id },
      });
      const documents = await prisma.documents.findMany({
        where: { contributionId: contribution.id },
      });

      for (let i = 0; i < documents.length; i++) {
        const fileData = await downloadFile(documents[i].path);
        const fileExtension = path.extname(documents[i].name);
        const uniqueFileName = `${contribution.title}_${documents[i].name}_${i}${fileExtension}`;
        zip.addFile(uniqueFileName, fileData);
      }

      for (let i = 0; i < images.length; i++) {
        const fileData = await downloadFile(images[i].path);
        const fileExtension = path.extname(images[i].name);
        const uniqueFileName = `${contribution.title}_${images[i].name}_${i}${fileExtension}`;
        zip.addFile(uniqueFileName, fileData);
      }
    }

    //download storage
    var DOWNLOAD_DIR = path.join(
      process.env.HOME || process.env.USERPROFILE,
      "downloads/"
    );
    //day
    const currentDate = new Date();
    const formattedDate = currentDate
      .toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .split(":")
      .join("-");
    //
    const outputPath = path.join(DOWNLOAD_DIR + `${formattedDate}_output.zip`);
    fs.writeFileSync(outputPath, zip.toBuffer());
    res.download(outputPath);

    res.status(StatusCodes.OK).json({
      message: "Download succeefully",
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
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
