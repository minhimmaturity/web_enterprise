const { PrismaClient, Role } = require("@prisma/client");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const redisClient = require("../utils/connectRedis");
const hashPassword = require("../utils/hashPassword");
const { sendMailToUser } = require("../utils/mail-service");
const randomstring = require("randomstring");
const prisma = new PrismaClient();

dotenv.config();

const register = async (req, res) => {
  try {
    const { name, email, avatar } = req.body;

    // Ensure that only users with the role 'GUEST' can be registered
    const userRole = Role.GUEST;

    const password = randomstring.generate();
    const passwordAfterHash = await hashPassword(password);
    const user = {
      name,
      email,
      password: passwordAfterHash,
      role: userRole,
      default_pasword: passwordAfterHash,
      avatar: avatar,
    };

    try {
      const createUser = await prisma.user.create({ data: user });
      res.status(StatusCodes.OK).json({
        message: "User created successfully",
        user: createUser,
      });
          // Create user

    // Send email to user
    await sendMailToUser(email, password, name);


    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        // Handle unique constraint violation error
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "Email is already registered",
        });
      }
      // Handle other errors
      console.error(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};
const getAllFaculties = async (req, res) => {
  try {
    const faculties = await prisma.faculty.findMany();
    res.status(200).json({ faculties });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getPublicContributionsInFaculty = async (req, res) => {
  const { facultyId } = req.params;

  try {
    // Check if the faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: {
        id: facultyId,
      },
    });

    if (!faculty) {
      return res.status(404).json({ error: "Faculty not found" });
    }

    const limit = 10;
    let offset = 0;
    let allPublicContributions = [];
    const { sort } = req.query;
    const usersInFaculty = await prisma.user.findMany({
      where: {
        FacultyId: facultyId,
      },
    });

    const userIdsInFaculty = usersInFaculty.map(user => user.id);

 
    const queryOptions = {
      where: {
        is_public: true,
        userId: {
          in: userIdsInFaculty,
        },
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
      orderBy: { createdAt: sort === 'asc' ? 'asc' : 'desc' }
    };

    while (true) {
      const contributions = await prisma.contribution.findMany({
        ...queryOptions,
        skip: offset
      });

      if (contributions.length === 0) {
        break;
      }

      allPublicContributions.push(contributions);
      offset += limit;
    }

    res.status(200).json({ allPublicContributions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};





module.exports = {
  register,
  getAllFaculties,
  getPublicContributionsInFaculty
};
