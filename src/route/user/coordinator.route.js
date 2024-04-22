const express = require("express");
const { Router } = express;
const { authMiddleware } = require("../../middleware/checkRole");
const { Role } = require("@prisma/client");
const coordinator = express.Router();
const { validationResult } = require("express-validator");
const {
  viewContribution,
  chooseContribution,
  downloadContribution,
  viewAllStudentInFaculty,
} = require("../../controller/coordinator.controller");
const {countNotifications} = require("../../controller/user.controller")
const validate = require("../../middleware/validate");

const checkDefaultPassword = require("../../middleware/checkDefaultPassword");
const isLocked = require("../../middleware/isLocked");
coordinator.use(express.json());
coordinator.get(
  "/viewContribution",
  authMiddleware([Role.COORDIONATOR]),
  isLocked,
  checkDefaultPassword,
  viewContribution
);
coordinator.get(
  "/downloadContribution",
  authMiddleware([Role.COORDIONATOR]),
  isLocked,
  checkDefaultPassword,
  downloadContribution
);
coordinator.put(
  "/chooseContribution/:Id",
  authMiddleware([Role.COORDIONATOR]),
  isLocked,
  checkDefaultPassword,
  chooseContribution
);

coordinator.get(
  "/getAllStudentInFaculty",
  authMiddleware([Role.COORDIONATOR]),
  isLocked,
  checkDefaultPassword,
  viewAllStudentInFaculty
);

coordinator.get(
  "/countNotifications",
  authMiddleware([Role.COORDIONATOR]),
  isLocked,
  checkDefaultPassword,
  countNotifications
)

module.exports = coordinator;
