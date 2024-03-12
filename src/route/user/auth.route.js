const express = require("express");
const { Router } = express;
const { register, login } = require("../../controller/auth.controller");
const { body, validationResult } = require("express-validator");

const auth = Router();

// Middleware to parse JSON in the request body
auth.use(express.json());

auth.post(
  "/register",
  [
    body("email")
      .isEmail()
      .withMessage("Invalid email address")
      .notEmpty()
      .withMessage("Email is required")
      .isString(),
    body("name")
      .notEmpty()
      .withMessage("Name is required")
      .isString()
      .withMessage("Name must be string"),
    body("password")
      .isStrongPassword()
      .withMessage("this is not a strong password")
      .isLength(8, 24)
      .withMessage(
        "Password must have a minimum of 8 characters and a maximun of 24 characters"
      )
      .notEmpty()
      .withMessage("Password is required"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // If there are no validation errors, proceed to the next middleware or route handler
    register(req, res, next);
  }
);

auth.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Invalid email address")
      .notEmpty()
      .withMessage("Email is required")
      .isString(),
    body("name")
      .notEmpty()
      .withMessage("Name is required")
      .isString()
      .withMessage("Name must be string"),
    body("password")
      .isString()
      .withMessage("Password must be string")
      .notEmpty()
      .withMessage("Password is required"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // If there are no validation errors, proceed to the next middleware or route handler
    login(req, res, next);
  }
);

module.exports = auth;
