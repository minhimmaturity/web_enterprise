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
  editUserProfile,
} = require("../../controller/admin.controller");

const { authMiddleware } = require("../../middleware/checkRole");
const { Role } = require("@prisma/client");
const validate = require("../../middleware/validate");
const admin = express.Router();
const { validationResult } = require("express-validator");
const checkDefaultPassword = require("../../middleware/checkDefaultPassword");
const { viewMyProfile } = require("../../controller/user.controller");

admin.use(express.json());

admin.post(
  "/registerForUser",
  validate.validateRegister(), (req, res) => {
    const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  createAccountForUser(req, res)
  }, 
  
);
// ACADEMIC YEAR
admin.post(
  "/createAcademicYear",
  authMiddleware([Role.ADMIN]),
  validate.validateCreateAcademicYear(),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    createAcademicYear(req, res, next);
  }
);

admin.put(
  "/updateAcademicYear/:Id",
  authMiddleware([Role.ADMIN]),
  validate.validateCreateAcademicYear(),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    updateAcademicYear(req, res, next)
  }
);


admin.delete(
  "/deleteAcademicYear/:Id",
  authMiddleware([Role.ADMIN]),
  deleteAcademicYear
);
admin.get(
  "/viewAcademicYears",
  authMiddleware([Role.ADMIN]),
  viewAcademicYears
);

//FACULTY
admin.post("/createFaculty", authMiddleware([Role.ADMIN]), validate.validateCreateFaculty(),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    } createFaculty(req, res, next)
  });
admin.put("/updateFaculty/:Id", authMiddleware([Role.ADMIN]), validate.validateUpdateFaculty(),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    } updateFaculty(req, res, next)
  });


// admin.delete("/deleteFaculty/:Id", authMiddleware([Role.ADMIN]), deleteFaculty);
admin.get("/viewFaculties", authMiddleware([Role.ADMIN]), viewFaculties); //chunk

//Users
admin.get("/viewAllAccount", authMiddleware([Role.ADMIN]), viewAllAccount);
admin.put("/editUser/:Id", authMiddleware([Role.ADMIN]), editUserProfile);
admin.get(
  "/viewProfile",
  authMiddleware([Role.ADMIN]),
  viewMyProfile
);

module.exports = admin;
