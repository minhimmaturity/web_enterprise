const express = require("express");
const { Router } = express;
const {
  register,
  login,
  authToken,
  refreshToken,
  resetDefaultPassword,
} = require("../../controller/auth.controller");
const { validationResult } = require("express-validator");
const { publicPosts, privatePosts } = require("../../../database");
const validate = require("../../middleware/validate");
const isLocked = require("../../middleware/isLocked");
const { PrismaClient, Role } = require("@prisma/client");
const checkDefaultPassword = require("../../middleware/checkDefaultPassword");
const { authMiddleware } = require("../../middleware/checkRole");
const prisma = new PrismaClient();
const auth = Router();

// Middleware to parse JSON in the request body
auth.use(express.json());
auth.get("/public", (req, res) => {
  res.json(publicPosts);
});
// auth.put('/editProfile', editUserProfile);

// auth.get("/private", refreshAccessToken, (req, res) => {
//   res.json(privatePosts);
// });
auth.get("/private1", authToken, (req, res) => {
  res.json(privatePosts);
});
auth.post("/register", validate.validateRegister(), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Proceed with registration logic if validation passes
  res.status(200).json({ message: "register user successfully" });
});

auth.post(
  "/login",
  validate.validateLogin(),
  isLocked,
  checkDefaultPassword,
  login
);

auth.get("/refreshAccessToken", authMiddleware([Role.STUDENT, Role.COORDIONATOR, Role.MANAGER, Role.GUEST, Role.ADMIN]), refreshToken)

auth.put("/resetDefaultPassword/:email/:default_pasword", validate.validateResetPassword(), resetDefaultPassword);

module.exports = auth;
