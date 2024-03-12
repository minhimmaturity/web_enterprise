const { PrismaClient, Role } = require("@prisma/client");
const dotenv = require("dotenv");
const randomstring = require("randomstring");
const bcrypt = require("bcrypt")


const prisma = new PrismaClient();

dotenv.config();

const saltRounds = 10;

const createAccountForUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const password = randomstring.generate();
    const passwordAfterHash = await bcrypt.hash(password, saltRounds);

    const roleMapping = {
      'Marketing Manager': Role.MANAGER,
      'Marketing Coordinator': Role.COORDIONATOR,
    };

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

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
      default_pasword: passwordAfterHash
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



  module.exports = {createAccountForUser}


  