const express = require("express");
const { Router } = express;
const { authMiddleware } = require("../../middleware/checkRole");
const { Role } = require("@prisma/client");
const {
    getContributionsStatsByFacultyAndYear, getContributionPercentageByFaculty,
} = require("../../controller/manager.controller");

const manager = Router();

manager.get(
    "/getContributionsStatsByFacultyAndYear",

    getContributionsStatsByFacultyAndYear
);


manager.get(
    "/getContributionPercentageByFaculty",

    getContributionPercentageByFaculty
);



module.exports = manager;
