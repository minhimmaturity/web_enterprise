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
  deleteContribution,
  editMyContributions,
  getPublishContributions,
  viewCoordinatorByFaculty
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
  authMiddleware([Role.STUDENT]),
  uploadMiddleware,
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
  authMiddleware([Role.STUDENT, Role.COORDIONATOR]),
  checkDefaultPassword,
  viewContributionDetail
);

user.get(
  "/viewProfile",
  authMiddleware([Role.STUDENT, Role.COORDIONATOR, Role.MANAGER]),
  checkDefaultPassword,
  viewMyProfile
);
user.get(
  "/getPublishContributions",
  getPublishContributions
);

user.delete(
  "/deleteContribution/:Id",
  authMiddleware([Role.STUDENT]),
  deleteContribution
);

user.put(
  "/editMyContribution/:contributionId",
  authMiddleware([Role.STUDENT]),
  uploadMiddleware,
  checkDefaultPassword,
  editMyContributions
);

user.get(
  "/viewCoordinator/:facultyId",
  authMiddleware([Role.STUDENT]),
  checkDefaultPassword,
  viewCoordinatorByFaculty
);

module.exports = user;
