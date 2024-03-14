const express = require("express");
const { Router } = express;
const {createAccountForUser, createAcademicYear,  createFaculty,
    updateFaculty,
    deleteFaculty,
    viewFaculties,} = require("../../controller/admin.controller")
    const { checkRole1 } = require('../../middleware/checkRole');
    const { Role } = require("@prisma/client");

const admin = express.Router();

admin.use(express.json());

admin.post("/registerForUser", createAccountForUser);

admin.post("/createAcademicYear", createAcademicYear)

admin.post("/createFaculty", createFaculty)

admin.post("/updateFaculty",checkRole1([Role.ADMIN]), updateFaculty)

admin.post("/deleteFaculty",checkRole1([Role.ADMIN]), deleteFaculty)

admin.post("/viewFaculties",checkRole1([Role.ADMIN]), viewFaculties)

module.exports = admin;
