const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { sendMailResetPassword } = require("../utils/mail-service");
const redisClient = require("../utils/connectRedis");
const hashPassword = require("../utils/hashPassword");
const prisma = new PrismaClient();
const { StatusCodes } = require("http-status-codes");
const bucket = require("../utils/firebase");

const changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const validPassword = await bcrypt.compare(oldPassword, user.password);

    if (!validPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Invalid old password",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: {
        email,
      },
      data: {
        password: hashedPassword,
      },
    });

    res.status(StatusCodes.OK).json({
      message: "Password updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

const editUserProfile = async (req, res) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },
    });

    if (!existingUser) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const { name, avatar } = req.body;

    const userToUpdate = await prisma.user.findUnique({
      where: {
        email: req.decodedPayload.data.email, // Use email as the unique identifier
      },
    });

    if (!userToUpdate) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        email: req.decodedPayload.data.email, // Use email as the unique identifier
      },
      data: {
        name,
        avatar,
      },
    });

    res.status(StatusCodes.OK).json({
      message: "User profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

const sentOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    await sendMailResetPassword(email);

    res.status(StatusCodes.OK).json({
      message: "Password reset link sent successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

const resetPassword = async (req, res) => {
  const { otp, email, newPassword, reNewPassword } = req.body;
  const key = "otp" + " " + email;
  const otpInRedis = await redisClient.get(key);

  if (!otpInRedis) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Invalid otp",
    });
  }

  if (otp !== otpInRedis) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Invalid otp",
    });
  }

  if (newPassword !== reNewPassword) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Passwords do not match",
    });
  }

  const password = await hashPassword(newPassword);

  const updatedUser = await prisma.user.update({
    where: { email: email },
    data: { password: password },
  });

  res.status(StatusCodes.OK).json({
    message: "Password updated successfully",
    user: updatedUser,
  });
};

const uploadContribution = async (req, res) => {
  try {
    // Save contribution
    const currentTimestamp = new Date();

    const academicYear = await prisma.academicYear.findFirst({
      where: {
        closure_date: { gte: currentTimestamp },
      },
    });

    if (!academicYear) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "No academic year found",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },
    });
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "No user found",
      });
    }

    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Title and description are required",
      });
    }
    const newContribution = await prisma.contribution.create({
      data: {
        title: title,
        description: description,
        userId: user.id,
        AcademicYearId: academicYear.id,
      },
    });
    const files = req.files["files"];
    if (!files) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message:
          "At least one document or image is required for the contribution",
      });
    }

    // Upload documents to Firebase Storage
    if (files.filter((file) => file.mimetype.includes("application"))) {
      const documentUploadPromises = files
        .filter((file) => file.mimetype.includes("application"))
        .map(async (file) => {
          const filePath = `documents/${newContribution.id}/${file.originalname}`;
          const blob = bucket.file(filePath);

          // Upload file to Firebase Storage
          await blob.save(file.buffer, {
            metadata: {
              contentType: file.mimetype,
            },
          });

          // Get download URL for the document
          const [documentUrl] = await blob.getSignedUrl({
            action: "read",
            expires: "03-17-2025",
          });

          // Save document URL to database
          await prisma.documents.create({
            data: {
              name: file.originalname,
              path: documentUrl,
              contributionId: newContribution.id,
            },
          });

          return documentUrl;
        });

      // Wait for all document upload promises to resolve
      await Promise.all(documentUploadPromises);
    }

    // Upload images to Firebase Storage
    if (files.filter((file) => file.mimetype.includes("image"))) {
      const imageUploadPromises = files
        .filter((file) => file.mimetype.includes("image"))
        .map(async (file) => {
          const filePath = `images/${newContribution.id}/${file.originalname}`;
          const blob = bucket.file(filePath);

          // Upload file to Firebase Storage
          await blob.save(file.buffer, {
            metadata: {
              contentType: file.mimetype,
            },
          });

          // Get download URL for the image
          const [imageUrl] = await blob.getSignedUrl({
            action: "read",
            expires: "03-17-2025",
          });

          // Save image URL to database
          await prisma.image.create({
            data: {
              name: file.originalname,
              path: imageUrl,
              contributionId: newContribution.id,
            },
          });

          return imageUrl;
        });

      // Wait for all image upload promises to resolve
      await Promise.all(imageUploadPromises);
    }

    res
      .status(StatusCodes.OK)
      .json({ message: "Contribution uploaded successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

const viewMyContributions = async (req, res) => {
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
          userId: user.id,
        },
        include: {
          AcademicYear: {
            // Assuming academicYear is a related model
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
};
const viewContributionDetail = async (req, res) => {
  const { Id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const contributions = await prisma.contribution.findFirst({
      where: { id: Id },
    });

    const academicYear = await prisma.academicYear.findFirst({
      where: { id: contributions.AcademicYearId },
    });

    const document = await prisma.documents.findMany({
      where: { contributionId: contributions.id },
    });

    const image = await prisma.image.findMany({
      where: { contributionId: contributions.id },
    });

    res.status(StatusCodes.OK).json({
      message: "View details successfully",
      contribution: contributions,
      academicYear: {
        closure_date: academicYear.closure_date,
        final_closure_date: academicYear.final_closure_date,
      },
      document: document,
      image: image.map((image) => {
        return {
          name: image.name,
        };
      }),
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

const viewMyProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const userProfile = await prisma.user.findFirst({
      where: {
        id: user.id,
      },
    });

    res.status(StatusCodes.OK).json({
      userProfile,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  editUserProfile,
  changePassword,
  sentOtp,
  resetPassword,
  uploadContribution,
  viewMyContributions,
  viewContributionDetail,
  viewMyProfile,
};
