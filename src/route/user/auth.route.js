const express = require("express");
const { Router } = express;
const {
  register,
  login,
  authToken,
  refreshToken,
  editUserProfile,
} = require("../../controller/auth.controller");
const { validationResult } = require("express-validator");
const { publicPosts, privatePosts } = require("../../../database");
const validate = require("../../middleware/validate");
const isLocked = require("../../middleware/isLocked");
const { PrismaClient } = require("@prisma/client");
const checkDefaultPassword = require("../../middleware/checkDefaultPassword");
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
auth.post("/register", validate.validateRegister(), 
register);

auth.post("/login", validate.validateLogin(), isLocked, checkDefaultPassword, login);


module.exports = auth;
