const express = require("express");
const { Router } = express;
const { authMiddleware } = require("../../middleware/checkRole");
const { Role } = require("@prisma/client");
const validate = require("../../middleware/validate");
const guest = Router()
const { validationResult } = require("express-validator");
const checkDefaultPassword = require("../../middleware/checkDefaultPassword");
const { register, getAllFaculties,
    getPublicContributionsInFaculty,
    getContributionContentById} = require("../../controller/guest.controller");

guest.post(
    "/register",
    validate.validateRegister(),
    (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      // Proceed with registration logic if validation passes
      register(req, res)
    }
  );

// Route to get all faculties
guest.get("/faculties", getAllFaculties);

// Route to get all public contributions in a faculty
guest.get("/faculties/:facultyId", getPublicContributionsInFaculty);

module.exports = guest;
