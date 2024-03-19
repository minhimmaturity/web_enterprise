const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { sendMailResetPassword } = require("../utils/mail-service");
const redisClient = require("../utils/connectRedis");
const hashPassword = require("../utils/hashPassword");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const prisma = new PrismaClient();
const { StatusCodes } = require("http-status-codes");

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
    const { name, email, avatar } = req.body;

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

    const updatedUser = await prisma.user.update({
      where: {
        email,
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
    const { title, description } = req.body;
    if (!title) {
      throw new Error("Title is empty");
    }

    if (!description) {
      throw new Error("Description is empty");
    }

    const images = req.files["image"];
    const documents = req.files["document"];

    if (!req.files["image"] && !req.files["document"]) {
      throw new Error("No file is chosen");
    }

    const currentTimestamp = new Date();

    // Find the academic year ID by the current time
    const academicYear = await prisma.academicYear.findFirst({
      where: {
        closure_date: { gte: currentTimestamp }, // Now should be less than or equal to clousedate
      },
    });

    if (!academicYear) {
      throw new Error("No academic year found for the current timestamp");
    }

    //auth
    const user = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Create array
    const imageData = images
      ? images.map((image) => ({
          name: image.originalname,
          path: image.path,
        }))
      : [];

    const documentData = documents
      ? documents.map((document) => ({
          name: document.originalname,
          path: document.path,
        }))
      : [];

    const contribution = {
      title: title,
      description: description,
      AcademicYearId: academicYear.id,
      userId: user.id,
      Documents: { createMany: { data: documentData } },
      Image: { createMany: { data: imageData } },
    };

    await prisma.contribution.create({
      data: contribution,
    });

    res.status(StatusCodes.OK).json({
      message: "Contribution created successfully",
    });
  } catch (error) {
    //delete file if error
    const images = req.files["image"];
    const documents = req.files["document"];
    const files = [];
    if (!images && !documents) {
      files == [];
    } else if (!images) {
      files == [...documents];
    } else if (!documents) {
      files == [...images];
    } else {
      files == [...images, ...documents];
    }
    for (index = 0, len = files.length; index < len; index++) {
      console.log(files[index].path);
      fs.unlinkSync(files[index].path);
    }
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: error.message,
    });
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
};

module.exports = {
  editUserProfile,
  changePassword,
  sentOtp,
  resetPassword,
  uploadContribution,
  viewMyContributions,
};
