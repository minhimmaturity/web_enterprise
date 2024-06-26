const { PrismaClient, Role } = require("@prisma/client");
const dotenv = require("dotenv");
const randomstring = require("randomstring");
const { sendMailToUser } = require("../utils/mail-service");
const hashPassword = require("../utils/hashPassword");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const prisma = new PrismaClient();

dotenv.config();

const createAccountForUser = async (req, res) => {
  try {
    const { name, email, role, avatar, faculty } = req.body;
    const password = randomstring.generate();
    const passwordAfterHash = await hashPassword(password);

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(StatusCodes.CONFLICT).json({
        message: "User with this email already exists",
      });
    }

    // Validate role
    if (!Object.values(Role).includes(role)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Invalid role",
      });
    }

    let user;
    if (role === "COORDIONATOR" || role === "STUDENT") {
      user = {
        name,
        email,
        password: passwordAfterHash,
        role: role === "COORDIONATOR" ? Role.COORDIONATOR : Role.STUDENT,
        default_pasword: passwordAfterHash,
        avatar,
        // Include faculty if the user is coordinator or student
        FacultyId: faculty,
      };
    } else if (role === "MANAGER") {
      user = {
        name,
        email,
        password: passwordAfterHash,
        role: Role.MANAGER,
        default_pasword: passwordAfterHash,
        avatar,
        FacultyId: null,
      };
    }

    // Create user
    const createdUser = await prisma.user.create({ data: user });

    // Send email to user
    await sendMailToUser(email, password, name);

    res.status(StatusCodes.CREATED).json({
      message: "User created successfully",
      user: createdUser,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal Server Error",
    });
  }
};

const createAcademicYear = async (req, res) => {
  const { closure_date, final_closure_date } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { userId: user.id },
    });

    if (!admin) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Admin not found",
      });
    }

    const academicYear = {
      closure_date,
      final_closure_date,
      adminId: admin.id, // Associate the academic year with the admin
    };

    const academicYears = await prisma.academicYear.create({
      data: academicYear,
    });

    res.status(StatusCodes.OK).json({
      message: "Academic year created successfully",
      academicYear: academicYears,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};
const updateAcademicYear = async (req, res) => {
  const { Id } = req.params;
  const { closure_date, final_closure_date } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { userId: user.id },
    });

    if (!admin) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Admin not found",
      });
    }

    const academicYear = await prisma.academicYear.update({
      where: { id: Id },
      data: { closure_date, final_closure_date },
    });

    res.status(StatusCodes.OK).json({
      message: "Academic year updated successfully",
      academicYear,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

const deleteAcademicYear = async (req, res) => {
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

    const admin = await prisma.admin.findUnique({
      where: { userId: user.id },
    });

    if (!admin) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Admin not found",
      });
    }

    await prisma.academicYear.delete({
      where: { id: Id },
    });

    res.status(StatusCodes.OK).json({
      message: "Academic year deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};


const viewAcademicYears = async (req, res) => {
  try {
    const { sort } = req.query;
    const limit = 10;
    let offset = 0;
    let allAcademicYears = [];
    const queryOptions = {
      take: limit,
      skip: offset,
    };

    if (sort) {
      queryOptions.orderBy = {
        closure_date: sort === "asc" ? "asc" : "desc",
      };
    }

    while (true) {
      const academicYears = await prisma.academicYear.findMany(queryOptions);

      if (academicYears.length === 0) {
        break;
      }

      allAcademicYears.push(academicYears);
      offset += limit;
      queryOptions.skip = offset;
    }

    res.status(StatusCodes.OK).json({
      allAcademicYears: allAcademicYears,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

//FACULTY CRUD
const createFaculty = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Name is required",
    });
  }
  const user = await prisma.user.findUnique({
    where: { email: req.decodedPayload.data.email },
  });

  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "User not found",
    });
  }

  const admin = await prisma.admin.findUnique({
    where: { userId: user.id },
  });

  if (!admin) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Admin not found",
    });
  }

  const adminId = admin.id;

  const facultyData = {
    name: name,
    createBy: adminId,
  };
  console.log("Admin ID:", adminId);

  try {
    const faculty = await prisma.faculty.create({
      data: facultyData,
    });

    res.status(StatusCodes.OK).json({
      message: "Faculty created successfully",
      faculty,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

const updateFaculty = async (req, res) => {
  const { name } = req.body;
  const { Id } = req.params;

  try {
    const checkFaculty = await prisma.faculty.findFirst({
      where: { id: Id },
    });

   
    if (!checkFaculty) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Faculty not found",
      });
    }
    const faculty = await prisma.faculty.update({
      where: { id: Id },
      data: { name },
    });
    res.status(StatusCodes.OK).json({
      message: "Faculty updated successfully",
      faculty,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

// const deleteFaculty = async (req, res) => {
//   const { Id } = req.params;

//   try {
    
//     await prisma.faculty.delete({
//       where: { id: Id },
//     });

//     res.status(StatusCodes.OK).json({
//       message: "Faculty deleted successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(StatusCodes.BAD_GATEWAY).json({
//       message: "Internal Server Error",
//     });
//   }
// };

const viewFaculties = async (req, res) => {
  try {
    const { sort, name } = req.query;
    const limit = 10;
    let offset = 0;
    let allFaculties = [];
    const queryOptions = {
      take: limit,
      skip: offset,
    };

    if (name) {
      queryOptions.where = {
        name: {
          contains: name,
          mode: "insensitive",
        },
      };
    }

    if (sort) {
      queryOptions.orderBy = {
        createAt: sort === "asc" ? "asc" : "desc",
      };
    }

    while (true) {
      const faculties = await prisma.faculty.findMany(queryOptions);

      if (faculties.length === 0) {
        break;
      }

      allFaculties.push(faculties);
      offset += limit;
      queryOptions.skip = offset;
    }

    res.status(StatusCodes.OK).json({
      allFaculties: allFaculties,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

const viewAllAccount = async (req, res) => {
  try {
    const limit = 10;
    let offset = 0;
    let allAcademicYears = [];
    const { name, email, role } = req.query;

    while (true) {
      const queryOptions = {
        skip: offset, // bỏ qua bao nhiêu bản ghi
        take: limit, // lấy bao nhiêu bản ghi
      };

      if (name) {
        queryOptions.where = {
          name: {
            contains: name,
            mode: "insensitive", //support case-insensitive filtering
          },
        };
      }

      if (email) {
        queryOptions.where = {
          email: {
            contains: email,
            mode: "insensitive", //support case-insensitive filtering
          },
        };
      }

      //sort the list by role:ADMIN,STUDENT,..
      if (role) {
        queryOptions.where = {
          role: {
            equals: role,
          },
        };
      }

      const academicYears = await prisma.user.findMany({
        ...queryOptions,
        orderBy: {
          createAt: "desc", // or 'desc' for descending order
        },
      });

      if (academicYears.length === 0) {
        // No more documents left to fetch
        break;
      }

      allAcademicYears.push(academicYears);
      offset += limit;
    }

    res.status(StatusCodes.OK).json({
      account: allAcademicYears,
    });
  } catch (error) {
    console.log(error.message);
  }
};
const editUserProfile = async (req, res) => {
  const { Id } = req.params;
  const { name, is_locked } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: Id } });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Id },
      data: { name, is_locked},
    });

    res.status(StatusCodes.OK).json({
      message: "User profile updated successfully",
      updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  createAccountForUser,
  createAcademicYear,
  createFaculty,
  updateFaculty,
  viewFaculties,
  updateAcademicYear,
  deleteAcademicYear,
  viewAcademicYears,
  viewAllAccount,
  editUserProfile,
};
