const { check } = require("express-validator");

const validateRegisterUser = () => {
  return [
    check("name")
      .not()
      .isEmpty()
      .withMessage("Name is required")
      .isString()
      .withMessage("Name must be string"),
    check("email")
      .isEmail()
      .withMessage("Invalid email address")
      .notEmpty()
      .withMessage("Email is required")
      .isString(),
    check("password")
      .isStrongPassword()
      .withMessage("this is not a strong password")
      .isLength(8, 24)
      .withMessage(
        "Password must have a minimum of 8 characters and a maximun of 24 characters"
      )
      .notEmpty()
      .withMessage("Password is required"),
    check("avatar").notEmpty().withMessage("Avatar is required"),
    check("role").notEmpty().withMessage("Role is required"),
  ];
};

const validateLogin = () => {
  return [
    check("email")
      .isEmail()
      .withMessage("Invalid email address")
      .notEmpty()
      .withMessage("Email is required")
      .isString(),
    check("password")
      .isString()
      .withMessage("Password must be string")
      .notEmpty()
      .withMessage("Password is required"),
  ];
};

let validate = {
  validateRegisterUser: validateRegisterUser,
  validateLogin: validateLogin,
};

module.exports = { validate };
