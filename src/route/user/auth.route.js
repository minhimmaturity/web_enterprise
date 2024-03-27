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
auth.post("/register", validate.validateRegister(), (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  // If there are no validation errors, proceed to the next middleware or route handler
  register(req, res, next);
});

auth.post("/login", validate.validateLogin(), (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  // If there are no validation errors, proceed to the next middleware or route handler
  login(req, res, next);
});

module.exports = auth;
