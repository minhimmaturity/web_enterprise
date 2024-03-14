const { PrismaClient, Role } = require("@prisma/client");
const dotenv = require("dotenv");
const randomstring = require("randomstring");
const sendMailToUser = require("../utils/mailRegister");
const hashPassword = require("../utils/hashPassword");

const prisma = new PrismaClient();

dotenv.config();

const createAccountForUser = async (req, res) => {
  try {
    const { name, email, role, avatar } = req.body;
    const password = randomstring.generate();
    const passwordAfterHash = await hashPassword(password);

    const roleMapping = {
      "Marketing Manager": Role.MANAGER,
      "Marketing Coordinator": Role.COORDIONATOR,
    };

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    await sendMailToUser(email, password, name);

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    const userRole = roleMapping[role] || Role.STUDENT;

    const user = {
      name,
      email,
      password: passwordAfterHash,
      role: userRole,
      default_pasword: passwordAfterHash,
      avatar: avatar,
    };

    const createUser = await prisma.user.create({ data: user });

    res.status(201).json({
      message: "User created successfully",
      user: createUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = { createAccountForUser };
