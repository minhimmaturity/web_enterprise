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
  viewContributionDetail,
  viewMyProfile,
} = require("../../controller/user.controller");
const { uploadMiddleware } = require("../../middleware/upload"); // Import the middleware
const validate = require("../../middleware/validate");
const user = Router();

// Other routes...

user.put("/editProfile", editUserProfile);
user.put("/changePassword", changePassword);
user.post("/otp", sentOtp);
user.put("/resetPassword", resetPassword);

// Route for uploading submission with middleware
user.post(
  "/uploadContribution",
  uploadMiddleware,
  authMiddleware([Role.STUDENT]),
  uploadContribution
);

user.get(
  "/viewMyContributions",
  authMiddleware([Role.STUDENT]),
  viewMyContributions
);

user.get("/viewMyContributions/:Id", authMiddleware([Role.STUDENT]), viewContributionDetail);

user.get(
  "/viewProfile",
  authMiddleware([Role.STUDENT, Role.COORDIONATOR, Role.MANAGER, Role.ADMIN]), 
  viewMyProfile
);

module.exports = user;
