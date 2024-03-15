const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { sendMailResetPassword } = require("../utils/mail-service");
const redisClient = require("../utils/connectRedis");
const hashPassword = require("../utils/hashPassword");

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

module.exports = { editUserProfile, changePassword, sentOtp, resetPassword };
