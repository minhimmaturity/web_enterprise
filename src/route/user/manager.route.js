const express = require("express");
const { Router } = express;
const { authMiddleware } = require("../../middleware/checkRole");
const { Role } = require("@prisma/client");
const {
  getContributionsStatsByFacultyAndYear,
  getContributionPercentageByFaculty,
  CountContributionsStats, viewExceptionReport, downloadContribution,
  publishContribution,
  getChosenContributions,
} = require("../../controller/manager.controller");
const checkDefaultPassword = require("../../middleware/checkDefaultPassword");
const isLocked = require("../../middleware/isLocked");

const manager = Router();

manager.get(
  "/getContributionsStatsByFacultyAndYear",
  authMiddleware([Role.MANAGER]),
  isLocked,
  checkDefaultPassword,
  getContributionsStatsByFacultyAndYear
);

manager.get(
  "/getContributionPercentageByFaculty",
  authMiddleware([Role.MANAGER]),
  isLocked,
  checkDefaultPassword,
  getContributionPercentageByFaculty
);

manager.get(
  "/getChosenContributions",
  authMiddleware([Role.MANAGER]),
  isLocked,
  checkDefaultPassword,
  getChosenContributions
);

manager.put(
  "/publishContribution/:Id",
  authMiddleware([Role.MANAGER]),
  isLocked,
  checkDefaultPassword,
  publishContribution
);

manager.get(
  "/viewExceptionReports",
  authMiddleware([Role.MANAGER]),
  isLocked,
  checkDefaultPassword,
  viewExceptionReport
);

manager.get(
  "/CountContributionsStats",
  authMiddleware([Role.MANAGER]),
  isLocked,
  checkDefaultPassword,
  CountContributionsStats
);

manager.get(
  "/downloadContribution",
  authMiddleware([Role.MANAGER]),
  isLocked,
  checkDefaultPassword,
  downloadContribution
);

module.exports = manager;
