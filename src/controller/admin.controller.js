const { PrismaClient, Role } = require("@prisma/client");
const dotenv = require("dotenv");
const randomstring = require("randomstring");
const sendMailToUser = require("../utils/mailRegister");
const hashPassword = require("../utils/hashPassword");
const jwt = require("jsonwebtoken");

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
//ACADEMIC YEAR CRUD
// const createAcademicYear = async(req, res) => {
//   const {closure_date, final_closure_date} = req.body

//   const academicYear = {
//     closure_date: closure_date,
//     final_closure_date: final_closure_date,
//     adminId: "fd4ffef9-2408-4a06-b22c-95a5c8d76ef6"
//   }

//   await prisma.academicYear.create({
//     data: academicYear
//   })
// }
const createAcademicYear = async (req, res) => {
  try {
    const { closure_date, final_closure_date } = req.body;

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    const decodedPayload = jwt.verify(token, process.env.SECRET_KEY);
    const user = await prisma.user.findUnique({
      where: { email: decodedPayload.data.email },
    });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    const admin = await prisma.admin.findUnique({
      where: { userId: user.id },
    });
    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }
    const adminId = admin.id;

    const academicYear = {
      closure_date,
      final_closure_date,
      adminId, // Associate the academic year with the admin
    };

    await prisma.academicYear.create({
      data: academicYear,
    });

    res.status(201).json({
      message: "Academic year created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const updateAcademicYear = async (req, res) => {
  const { id, closure_date, final_closure_date } = req.body;

  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    const decodedPayload = jwt.verify(token, process.env.SECRET_KEY);
    const user = await prisma.user.findUnique({
      where: { email: decodedPayload.data.email },
    });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    const admin = await prisma.admin.findUnique({
      where: { userId: user.id },
    });
    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }
    const academicYear = await prisma.academicYear.update({
      where: { id },
      data: { closure_date, final_closure_date },
    });

    res.status(200).json({
      message: "Academic year updated successfully",
      academicYear,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const deleteAcademicYear = async (req, res) => {
  const { id } = req.body;

  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    const decodedPayload = jwt.verify(token, process.env.SECRET_KEY);
    const user = await prisma.user.findUnique({
      where: { email: decodedPayload.data.email },
    });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    const admin = await prisma.admin.findUnique({
      where: { userId: user.id },
    });
    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      }); 
    }
    await prisma.academicYear.delete({
      where: { id },
    });

    res.status(200).json({
      message: "Academic year deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const viewAcademicYears = async (req, res) => {
  try {
    const academicYears = await prisma.academicYear.findMany();

    res.status(200).json({
      message: "Academic years retrieved successfully",
      academicYears,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

//FACULTY CRUD
const createFaculty = async (req, res) => {
  const { name} = req.body;
  // const authHeader = req.headers['authorization'];
  // const token = authHeader && authHeader.split(' ')[1];

  // const decodedPayload = jwt.verify(token, process.env.SECRET_KEY);
  // console.log('Decoded Payload:', decodedPayload); 
  
  // const user = await prisma.user.findUnique({
  //     where: { email: decodedPayload.data.email },
  // });
  const user = await prisma.user.findUnique({
    where: { email: req.decodedPayload.data.email },
});
  
  if (!user) {
      return res.status(404).json({
          message: "User not found",
      });
  }
  
  const admin = await prisma.admin.findUnique({
      where: { userId: user.id }
  });
  
  if (!admin) {
      return res.status(404).json({
          message: "Admin not found",
      });
  }
  
  const adminId = admin.id;
  
  
  const facultyData = {
    name:name,
    createBy: adminId
  }
  console.log('Admin ID:', adminId); 
  
  try {
    const faculty = await prisma.faculty.create({
      data: facultyData
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
  updateAcademicYear,
  deleteAcademicYear,
  viewAcademicYears,
};