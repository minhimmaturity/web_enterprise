const express = require("express");
const { Router } = express;
const {
  createAccountForUser,
  createAcademicYear,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  viewFaculties,
  updateAcademicYear,
  deleteAcademicYear,
  viewAllAccount,
  viewAcademicYears,
} = require("../../controller/admin.controller");

const { authMiddleware } = require("../../middleware/checkRole");
const { Role } = require("@prisma/client");
const validate = require("../../middleware/validate");
const admin = express.Router();

admin.use(express.json());

admin.post(
  "/registerForUser",
  validate.validateRegister(),
  createAccountForUser
);
//ACADEMIC YEAR
admin.post(
  "/createAcademicYear",
  authMiddleware([Role.ADMIN]),
  createAcademicYear
);
admin.put(
  "/updateAcademicYear/:facultyId",
  authMiddleware([Role.ADMIN]),
  updateAcademicYear
);
admin.delete(
  "/deleteAcademicYear/:facultyId",
  authMiddleware([Role.ADMIN]),
  deleteAcademicYear
);
admin.get(
  "/viewAcademicYears",
  authMiddleware([Role.ADMIN]),
  viewAcademicYears
);

//FACULTY
admin.post("/createFaculty", authMiddleware([Role.ADMIN]), createFaculty);
admin.put(
  "/updateFaculty/:facultyId",
  authMiddleware([Role.ADMIN]),
  updateFaculty
);
admin.delete(
  "/deleteFaculty/:facultyId",
  authMiddleware([Role.ADMIN]),
  deleteFaculty
);
admin.get("/viewFaculties", authMiddleware([Role.ADMIN]), viewFaculties);
admin.get("/viewAllAccount", authMiddleware([Role.ADMIN]), viewAllAccount);

module.exports = admin;
