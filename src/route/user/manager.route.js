const express = require("express");
const { Router } = express;
const { authMiddleware } = require("../../middleware/checkRole");
const { Role } = require("@prisma/client");
const {
  getContributionsStatsByFacultyAndYear,
  getContributionPercentageByFaculty,
  chooseContribution,
  publishContribution,
  getChosenContributions,
} = require("../../controller/manager.controller");
const checkDefaultPassword = require("../../middleware/checkDefaultPassword");

const manager = Router();

manager.get(
  "/getContributionsStatsByFacultyAndYear",
  checkDefaultPassword,
  getContributionsStatsByFacultyAndYear
);

manager.get(
  "/getContributionPercentageByFaculty",
  checkDefaultPassword,
  getContributionPercentageByFaculty
);

manager.get(
  "/getChosenContributions", // Remove the extra space
  checkDefaultPassword,
  getChosenContributions
);

manager.put(
  "/publishContribution/:Id", // Add colon before "Id"
  checkDefaultPassword,
  publishContribution
);

module.exports = manager;
