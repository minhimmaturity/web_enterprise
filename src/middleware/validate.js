const { check } = require("express-validator");

let validateRegister = () => {
  return [
    check("email")
      .isEmail()
      .withMessage("Invalid email address")
      .notEmpty()
      .withMessage("Email is required")
      .isString(),
    check("name")
      .notEmpty()
      .withMessage("Name is required")
      .isString()
      .withMessage("Name must be string"),
    check("password")
      .isStrongPassword()
      .withMessage("this is not a strong password")
      .isLength(8, 24)
      .withMessage(
        "Password must have a minimum of 8 characters and a maximun of 24 characters"
      )
      .notEmpty()
      .withMessage("Password is required"),
    check("avatar").notEmpty().withMessage("avatar is required"),
  ];
};

let validateLogin = () => {
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
let validateCreateAccountForUser = () => {
  return [
    check("email")
      .isEmail()
      .withMessage("Invalid email address")
      .notEmpty()
      .withMessage("Email is required")
      .isString(),
    check("name")
      .notEmpty()
      .withMessage("Name is required")
      .isString()
      .withMessage("Name must be string"),
    check("password")
      .isStrongPassword()
      .withMessage("this is not a strong password")
      .isLength(8, 24)
      .withMessage(
        "Password must have a minimum of 8 characters and a maximun of 24 characters"
      )
      .notEmpty()
      .withMessage("Password is required"),
    check("role").notEmpty().withMessage("role is required"),
    check("avatar").notEmpty().withMessage("avatar is required"),
  ];
};

let validateUpdateAcademicYear = () => {
  return [
    check("closure_date")
      .optional()
      .isISO8601()
      .withMessage("Invalid closure date format"),
    check("final_closure_date")
      .optional()
      .isISO8601()
      .withMessage("Invalid final closure date format"),
  ];
};

const validateCreateAcademicYear = () => {
  return [
    // Validation rules for creating academic years
    check("closure_date")
      .notEmpty()
      .withMessage("Closure date is required")
      .isISO8601()
      .withMessage("Invalid closure date format"),
    check("final_closure_date")
      .notEmpty()
      .withMessage("Final closure date is required")
      .isISO8601()
      .withMessage("Invalid final closure date format"),
  ];
};

const validateUploadContribution = () => {
  return [
    check("title").notEmpty().withMessage("Title is required"),
    check("description").notEmpty().withMessage("Description is required"),
  ];
};

let validate = {
  validateRegister: validateRegister,
  validateLogin: validateLogin,
  validateCreateAccountForUser: validateCreateAccountForUser,
  validateCreateAcademicYear: validateCreateAcademicYear,
  validateUpdateAcademicYear: validateUpdateAcademicYear,
  validateUploadContribution: validateUploadContribution,
};

module.exports = validate;
