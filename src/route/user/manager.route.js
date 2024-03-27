const express = require("express");
const { Router } = express;
const { authMiddleware } = require("../../middleware/checkRole");
const { Role } = require("@prisma/client");
const {
    getContributionsStatsByFacultyAndYear, 
    getContributionPercentageByFaculty, 
    chooseContribution, 
    publishContribution,
    getChosenContributions  } = require("../../controller/manager.controller");

const manager = Router();

manager.get(
    "/getContributionsStatsByFacultyAndYear",
    getContributionsStatsByFacultyAndYear
);

manager.get(
    "/getContributionPercentageByFaculty",
    getContributionPercentageByFaculty
);

manager.get(
    "/getChosenContributions", // Remove the extra space
    getChosenContributions
);

manager.put(
    "/publishContribution/:Id", // Add colon before "Id"
    publishContribution
);



module.exports = manager;
