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
  authMiddleware([Role.MANAGER]),
  checkDefaultPassword,
  getContributionsStatsByFacultyAndYear
);

manager.get(
  "/getContributionPercentageByFaculty",
  authMiddleware([Role.MANAGER]),
  checkDefaultPassword,
  getContributionPercentageByFaculty
);

manager.get(
  "/getChosenContributions", 
  authMiddleware([Role.MANAGER]),// Remove the extra space
  checkDefaultPassword,
  getChosenContributions
);

manager.put(
  "/publishContribution/:Id",
  authMiddleware([Role.MANAGER]),
   // Add colon before "Id"
  checkDefaultPassword,
  publishContribution
);

module.exports = manager;
