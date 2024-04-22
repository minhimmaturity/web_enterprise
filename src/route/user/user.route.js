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
const isLocked = require("../../middleware/isLocked");
const user = Router();

// Other routes...
user.put(
  "/editProfile",
  authMiddleware([Role.STUDENT, Role.COORDIONATOR, Role.MANAGER, Role.ADMIN, Role.GUEST]),
  isLocked,
  checkDefaultPassword,
  uploadMiddleware,
  editUserProfile
);
user.put("/changePassword", isLocked, changePassword);
user.post("/otp", isLocked, sentOtp);
user.put("/resetPassword", isLocked, resetPassword);

// Route for uploading submission with middleware
user.post(
  "/uploadContribution",
  authMiddleware([Role.STUDENT]),
  isLocked,
  uploadMiddleware,
  checkDefaultPassword,
  uploadContribution
);

user.get(
  "/viewMyContributions",
  authMiddleware([Role.STUDENT]),
  isLocked,
  checkDefaultPassword,
  viewMyContributions
);

user.get(
  "/viewMyContributions/:Id",
  authMiddleware([Role.STUDENT, Role.COORDIONATOR, Role.GUEST]),
  isLocked,
  checkDefaultPassword,
  viewContributionDetail
);

user.get(
  "/viewProfile",
  authMiddleware([Role.STUDENT, Role.COORDIONATOR, Role.MANAGER, Role.GUEST]),
  isLocked,
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
  isLocked,
  checkDefaultPassword,
  deleteContribution
);

user.put(
  "/editMyContribution/:contributionId",
  authMiddleware([Role.STUDENT]),
  isLocked,
  uploadMiddleware,
  checkDefaultPassword,
  editMyContributions
);

user.get(
  "/viewCoordinator/:facultyId",
  authMiddleware([Role.STUDENT]),
  isLocked,
  checkDefaultPassword,
  viewCoordinatorByFaculty
);
module.exports = user;
