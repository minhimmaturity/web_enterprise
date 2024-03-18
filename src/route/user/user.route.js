const express = require("express");
const { Router } = express;
const { authMiddleware } = require("../../middleware/checkRole");
const { Role } = require("@prisma/client");
const {
  editUserProfile,
  changePassword,
  sentOtp,
  resetPassword,
  uploadContribution,
  viewMyContributions,
} = require("../../controller/user.controller");
const {
  uploadMultipleFiles,
  handleUploadError,
} = require("../../middleware/upload"); // Import the middleware
const user = Router();

// Other routes...

user.put("/editProfile", editUserProfile);
user.put("/changePassword", changePassword);
user.post("/otp", sentOtp);
user.put("/resetPassword", resetPassword);

// Route for uploading submission with middleware
user.post(
  "/uploadContribution",
  uploadMultipleFiles,
  handleUploadError,
  authMiddleware([Role.STUDENT]),
  uploadContribution
);

user.get(
  "/viewMyContributions",
  authMiddleware([Role.STUDENT]),
  viewMyContributions
);

module.exports = user;
