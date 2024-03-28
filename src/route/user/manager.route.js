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
  authMiddleware([Role.STUDENT]),
  checkDefaultPassword,
  getContributionsStatsByFacultyAndYear
);

manager.get(
  "/getContributionPercentageByFaculty",
  authMiddleware([Role.STUDENT]),
  checkDefaultPassword,
  getContributionPercentageByFaculty
);

manager.get(
  "/getChosenContributions", 
  authMiddleware([Role.STUDENT]),// Remove the extra space
  checkDefaultPassword,
  getChosenContributions
);

manager.put(
  "/publishContribution/:Id",
  authMiddleware([Role.STUDENT]),
   // Add colon before "Id"
  checkDefaultPassword,
  publishContribution
);

module.exports = manager;
