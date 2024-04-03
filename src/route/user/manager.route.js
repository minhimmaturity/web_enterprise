const express = require("express");
const { Router } = express;
const { authMiddleware } = require("../../middleware/checkRole");
const { Role } = require("@prisma/client");
const {
  getContributionsStatsByFacultyAndYear,
  getContributionPercentageByFaculty,
  CountContributionsStats,viewExceptionReport,downloadContribution,
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

manager.get(
  "/viewExceptionReports", 
  authMiddleware([Role.MANAGER]),
  checkDefaultPassword,
  viewExceptionReport
);
manager.get(
  "/CountContributionsStats", 
  authMiddleware([Role.MANAGER]),
  checkDefaultPassword,
  CountContributionsStats
);

manager.get(
  "/downloadContribution",
  authMiddleware([Role.MANAGER]),
  checkDefaultPassword,
  downloadContribution
);

module.exports = manager;
