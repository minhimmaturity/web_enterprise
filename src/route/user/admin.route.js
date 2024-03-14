const express = require("express");
const { Router } = express;
const {createAccountForUser, createAcademicYear,  createFaculty,
    updateFaculty,
    deleteFaculty,
    viewFaculties,} = require("../../controller/admin.controller")
    const { authenticateToken } = require('../../middleware/authenticateToken');

const {adminMiddleware} = require("../../middleware/admin");
const admin = express.Router();

admin.use(express.json());

admin.post("/registerForUser", createAccountForUser);

admin.post("/createAcademicYear", createAcademicYear)

admin.post("/createFaculty",authenticateToken, adminMiddleware, createFaculty)
admin.put("/updateFaculty/:facultyId", authenticateToken, adminMiddleware,  updateFaculty);

admin.delete("/deleteFaculty/:facultyId", authenticateToken, adminMiddleware, deleteFaculty);

admin.get("/viewFaculties", authenticateToken, adminMiddleware, viewFaculties);

module.exports = admin;
