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

const createAcademicYear = async(req, res) => {
  const {closure_date, final_closure_date} = req.body

  const academicYear = {
    closure_date: closure_date,
    final_closure_date: final_closure_date,
    adminId: "fd4ffef9-2408-4a06-b22c-95a5c8d76ef6"
  }

  await prisma.academicYear.create({
    data: academicYear
  })
}


const createFaculty = async (req, res) => {
  const { name, adminId } = req.body;

  try {
    const faculty = await prisma.faculty.create({
      data: { 
        name,
        admin: {
          connect: {
            id: adminId
          }
        }
      },
    });

    res.status(201).json({
      message: 'Faculty created successfully',
      faculty,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
};

const updateFaculty = async (req, res) => {
  const { id, name } = req.body;

  try {
    const faculty = await prisma.faculty.update({
      where: { id },
      data: { name },
    });

    res.status(200).json({
      message: 'Faculty updated successfully',
      faculty,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
};

const deleteFaculty = async (req, res) => {
  const { id } = req.body;

  try {
    await prisma.faculty.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Faculty deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
};

const viewFaculties = async (req, res) => {
  try {
    const faculties = await prisma.faculty.findMany();

    res.status(200).json({
      message: 'Faculties retrieved successfully',
      faculties,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
};

module.exports = {
  createAccountForUser,
  createAcademicYear,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  viewFaculties,
};