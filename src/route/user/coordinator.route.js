const express = require("express");
const { Router } = express;
const { authMiddleware } = require("../../middleware/checkRole");
const { Role } = require("@prisma/client");
const validate = require("../../middleware/validate");
const coordinator = express.Router();
const {  validationResult } = require("express-validator");
const {
    viewContribution
} = require("../../controller/coordinator.controller");
coordinator.use(express.json());
coordinator.get(
    "/viewContribution",
    authMiddleware([Role.COORDIONATOR]),
    viewContribution
  );
module.exports = coordinator;
