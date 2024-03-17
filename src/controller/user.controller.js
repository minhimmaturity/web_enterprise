const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { sendMailResetPassword } = require("../utils/mail-service");
const redisClient = require("../utils/connectRedis");
const hashPassword = require("../utils/hashPassword");
const jwt = require("jsonwebtoken");
const fs = require('fs')
const prisma = new PrismaClient();

const changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const validPassword = await bcrypt.compare(oldPassword, user.password);

    if (!validPassword) {
      return res.status(400).json({
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

    res.status(200).json({
      message: "Password updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
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
      return res.status(404).json({
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

    res.status(200).json({
      message: "User profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
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
      return res.status(404).json({
        message: "User not found",
      });
    }

    await sendMailResetPassword(email);

    res.status(200).json({
      message: "Password reset link sent successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const resetPassword = async (req, res) => {
  const { otp, email, newPassword, reNewPassword } = req.body;
  const key = "otp" + " " + email;
  const otpInRedis = await redisClient.get(key);

  if (!otpInRedis) {
    return res.status(400).json({
      message: "Invalid otp",
    });
  }

  if (otp !== otpInRedis) {
    return res.status(400).json({
      message: "Invalid otp",
    });
  }

  if (newPassword !== reNewPassword) {
    return res.status(400).json({
      message: "Passwords do not match",
    });
  }

  const password = await hashPassword(newPassword);

  const updatedUser = await prisma.user.update({
    where: { email: email },
    data: { password: password },
  });

  res.status(200).json({
    message: "Password updated successfully",
    user: updatedUser,
  });
};

const uploadContribution = async (req, res) => {
  try {
    const {title, description, close_date, facultyName} = req.body;
    const images = req.files['image'];
    const documents = req.files['document'];
    
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    const decodedPayload = jwt.verify(token, process.env.SECRET_KEY);
    const user = await prisma.user.findUnique({
      where: { email: decodedPayload.data.email },
    });
    if (!user) {
      throw new Error("User not found");
    }

    // Create array
    const imageData = images.map(image => {
      return {
        name: image.originalname,
        path: image.path,
      };
    });

    const documentData = documents.map(document => {
      return {
        name: document.originalname,
        path: document.path,
      };
    });

    //find faculty id from name
    const faculty = await prisma.faculty.findFirst({
      where: {
        name: facultyName,
      }
    })

    //check faculty exists
    if (!faculty) {
      throw new Error("Facalty not found");
    }

    const contribution = {
      title: title,
      description: description,
      close_date: close_date,
      facultyId: faculty.id, 
      userId: user.id,
      Documents: { createMany: { data: documentData } }, 
      Image: { createMany: { data: imageData } }
    };

    await prisma.contribution.create({
      data: contribution,
    });

    res.status(201).json({
      message: "Contribution created successfully",
    });
  } catch (error) {
    
    //delete file if error
    const images = req.files['image'];
    const documents = req.files['document'];
    const files = [...images, ...documents];
    for (index = 0, len = files.length; index < len; index++) {
      console.log(files[index].path)
      fs.unlinkSync(files[index].path);
    }
    console.error(error);
    res.status(500).json({
      message: error.message,
    });
  } 
}

const viewMyContributions = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    const decodedPayload = jwt.verify(token, process.env.SECRET_KEY);
    const user = await prisma.user.findUnique({
      where: { email: decodedPayload.data.email },
    });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const contributions = await prisma.contribution.findMany({
      where: {
        userId: user.id
      },
    });

    res.status(200).json({
      message: "Contributions retrieved successfully",
      contributions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = { editUserProfile, changePassword, sentOtp, resetPassword, uploadContribution,viewMyContributions };
