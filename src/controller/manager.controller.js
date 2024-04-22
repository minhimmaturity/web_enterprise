const { PrismaClient } = require("@prisma/client");
const { StatusCodes } = require("http-status-codes");
const prisma = new PrismaClient();
const {
  sendMailToCoordinator,
  sendMailToStudent,
} = require("../utils/mail-service");
const admZip = require("adm-zip");
const { downloadFile } = require("../utils/firebase");
const fs = require("fs");
const path = require("path");

const getContributionsStatsByFacultyAndYear = async (req, res) => {
  try {
    const contributions = await prisma.contribution.findMany({
      select: {
        id: true,
        AcademicYear: true,
        user: {
          select: {
            Faculty: true,
          },
        },
      },
    });

    const contributionsStats = {};
    contributions.forEach((contribution) => {
      const faculty = contribution.user?.Faculty;
      if (faculty && faculty.name) {
        const facultyName = faculty.name;
        const academicYearId = contribution.AcademicYear.id;
        if (!contributionsStats[facultyName]) {
          contributionsStats[facultyName] = {};
        }
        if (!contributionsStats[facultyName][academicYearId]) {
          contributionsStats[facultyName][academicYearId] = 1;
        } else {
          contributionsStats[facultyName][academicYearId]++;
        }
      }
    });

    res.json(contributionsStats);
  } catch (error) {
    console.error("Error fetching contributions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getContributionPercentageByFaculty = async (req, res) => {
  try {
    const contributions = await prisma.contribution.findMany({
      select: {
        id: true,
        user: {
          select: {
            Faculty: true,
          },
        },
      },
    });
    const facultyContributionsCount = {};
    const totalContributions = contributions.length;

    contributions.forEach((contribution) => {
      const faculty = contribution.user?.Faculty;
      if (faculty && faculty.name) {
        const facultyName = faculty.name;
        if (!facultyContributionsCount[facultyName]) {
          facultyContributionsCount[facultyName] = 1;
        } else {
          facultyContributionsCount[facultyName]++;
        }
      }
    });

    const contributionPercentageByFaculty = {};
    Object.keys(facultyContributionsCount).forEach((facultyName) => {
      const contributionCount = facultyContributionsCount[facultyName];
      const percentage = (contributionCount / totalContributions) * 100;
      contributionPercentageByFaculty[facultyName] = percentage.toFixed(2);
    });

    return res.status(StatusCodes.OK).json(contributionPercentageByFaculty);
  } catch (error) {
    console.error("Error fetching contribution percentage by faculty:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch contribution percentage by faculty" });
  }
};

const publishContribution = async (req, res) => {
  const { Id } = req.params;

  try {
    // Fetch the contribution
    const contribution = await prisma.contribution.findUnique({
      where: { id: Id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            FacultyId: true,
          },
        },
      },
    });

    // Check if the contribution exists
    if (!contribution) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Contribution not found." });
    }

    // Check if is_choosen is false
    if (contribution.is_choosen === false) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Cannot publish contribution because it is not chosen.",
      });
    }

    // Update the contribution
    const updatedContribution = await prisma.contribution.update({
      where: { id: Id },
      data: { is_public: true },
    });

    // Get the user's email associated with the contribution
    const userEmail = contribution.user.email;
    const userName = contribution.user.name;

    // Create a notification for the student
    const studentNotificationContent = `Your contribution titled "${updatedContribution.title}" has been published.`;
    const studentNotification = await prisma.notification.create({
      data: {
        content: studentNotificationContent,
        contributionId: updatedContribution.id,
        userId: contribution.user.id,
      },
    });

    // Send notification email to the user
    await sendMailToStudent(userName, userEmail, studentNotificationContent);

    // Send notification email to coordinators
    const coordinatorNotificationContent = `A contribution titled "${updatedContribution.title}" by ${contribution.user.name} has been published.`;
    const coordinators = await prisma.user.findMany({
      where: {
        FacultyId: contribution.user.FacultyId,
        role: "COORDIONATOR",
      },
      select: { id: true, email: true },
    });

    // Create notifications for coordinators
    const coordinatorNotifications = coordinators.map((coordinator) => {
      return prisma.notification.create({
        data: {
          content: coordinatorNotificationContent,
          contributionId: updatedContribution.id,
          userId: coordinator.id,
        },
      });
    });

    // Await creation of all coordinator notifications
    await Promise.all(coordinatorNotifications);
    coordinators.forEach((coordinator) => {
      console.log(coordinator.email);
    });
    // Send email to each coordinator
    coordinators.forEach(async (coordinator) => {
      await sendMailToCoordinator(
        coordinator.email,
        coordinatorNotificationContent
      );
    });

    // Send response
    res.status(StatusCodes.OK).json({
      message: "Contribution has been published.",
      contribution: updatedContribution,
      user: contribution.user.name
    
    });
  } catch (error) {
    console.error("Error publishing contribution:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to publish contribution." });
  }
};


const getChosenContributions = async (req, res) => {
  try {
    const limit = 10;
    let offset = 0;
    let allChosenContributions = [];
    const { sort } = req.query;

    const queryOptions = {
      where: {
        is_choosen: true
      },
      include: {
        user: {
          select: {
            name: true,
            Faculty: { select: { name: true } }
          }
        },
        AcademicYear: true,
        Documents: true,
        Image: true
      },
      take: limit,
      orderBy: { createdAt: sort === 'asc' ? 'asc' : 'desc' } // Move orderBy inside include
    };

    while (true) {
      const contributions = await prisma.contribution.findMany({
        ...queryOptions,
        skip: offset
      });

      if (contributions.length === 0) {
        break;
      }

      allChosenContributions.push(contributions);
      offset += limit;
    }

    res.status(StatusCodes.OK).json({ allChosenContributions });
  } catch (error) {
    console.error('Error fetching chosen contributions:', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch chosen contributions.' });
  }
};

const CountContributionsStats = async (req, res) => {
  try {
    const contributions = await prisma.contribution.findMany({
      select: {
        id: true,
        AcademicYear: true,
        user: {
          select: {
            Faculty: true,
          },
        },
      },
    });

    const contributionsStats = {
      totalContributions: contributions.length,
      contributionsByFaculty: {},
    };

    contributions.forEach((contribution) => {
      const faculty = contribution.user?.Faculty;
      if (faculty && faculty.name) {
        const facultyName = faculty.name;
        const academicYearId = contribution.AcademicYear.id;
        if (!contributionsStats.contributionsByFaculty[facultyName]) {
          contributionsStats.contributionsByFaculty[facultyName] = 1;
        } else {
          contributionsStats.contributionsByFaculty[facultyName]++;
        }
      }
    });

    res.json(contributionsStats);
  } catch (error) {
    console.error("Error fetching contributions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


const viewExceptionReport = async (req, res) => {
  try {
    const { in14days } = req.query;
    const currentTimestamp = new Date();
    const limit = 10;
    let offset = 0;
    let allContributions = [];
    const queryOptions = {
      take: limit,
      skip: offset,
      where: {
        is_choosen: true,
        NOT: {
          Comment: {
            some: {},
          },
        },
      },
      include: {
        user: {
          include: {
            Faculty: true, 
          },
        },
        AcademicYear: true,
      },
    };

    if (in14days) {
      queryOptions.where = {
        createdAt: {
          gte: currentTimestamp.toISOString(currentTimestamp.getDate() - 14),
        },
      };
    }

    while (true) {
      const contributions = await prisma.contribution.findMany(queryOptions);

      if (contributions.length === 0) {
        break;
      }

      allContributions.push(contributions);
      offset += limit;
      queryOptions.skip = offset;
    }

    res.status(StatusCodes.OK).json({
      allContributions: allContributions,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};
const downloadContribution = async (req, res) => {
  try {
    const zip = new admZip();
    const currentYear = new Date().getFullYear();

    const academicYear = await prisma.academicYear.findFirst({
      where: {
        final_closure_date: { gte: new Date(`${currentYear}-01-01T00:00:00.000Z`) } ,
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
        is_choosen: true,
        AcademicYearId: academicYear.id,
      },
    });

    if(contributions.length==0){
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

module.exports = {
  getContributionsStatsByFacultyAndYear,
  getContributionPercentageByFaculty,
  publishContribution,
  getChosenContributions,
  viewExceptionReport,
  downloadContribution,
  CountContributionsStats
};
