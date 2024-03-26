const express = require("express");
const { Router } = express;
const { authMiddleware } = require("../../middleware/checkRole");
const { Role } = require("@prisma/client");
const validate = require("../../middleware/validate");
const coordinator = express.Router();
const { validationResult } = require("express-validator");
const {
  viewContribution,
  chooseContribution,
} = require("../../controller/coordinator.controller");
coordinator.use(express.json());
coordinator.get(
  "/viewContribution",
  authMiddleware([Role.COORDIONATOR]),
  viewContribution
);
coordinator.put(
  "/chooseContribution/:Id",
  authMiddleware([Role.COORDIONATOR]),
  chooseContribution
);
module.exports = coordinator;
