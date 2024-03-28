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
const checkDefaultPassword = require("../../middleware/checkDefaultPassword");
const user = Router();

// Other routes...

user.put(
  "/editProfile",
  authMiddleware([Role.STUDENT, Role.COORDIONATOR, Role.MANAGER, Role.ADMIN]),
  checkDefaultPassword,
  editUserProfile
);
user.put("/changePassword", changePassword);
user.post("/otp", sentOtp);
user.put("/resetPassword", resetPassword);

// Route for uploading submission with middleware
user.post(
  "/uploadContribution",
  uploadMiddleware,
  authMiddleware([Role.STUDENT]),
  checkDefaultPassword,
  uploadContribution
);

user.get(
  "/viewMyContributions",
  authMiddleware([Role.STUDENT]),
  checkDefaultPassword,
  viewMyContributions
);

user.get(
  "/viewMyContributions/:Id",
  authMiddleware([Role.STUDENT]),
  checkDefaultPassword,
  viewContributionDetail
);

user.get(
  "/viewProfile",
  authMiddleware([Role.STUDENT, Role.COORDIONATOR, Role.MANAGER]),
  checkDefaultPassword,
  viewMyProfile
);

module.exports = user;
