const express = require("express");
const { Router } = express;
const {
  editUserProfile,
  changePassword,
  sentOtp,
  resetPassword,
} = require("../../controller/user.controller");
const user = Router();

// Other routes...

user.put("/editProfile", editUserProfile);
user.put("/changePassword", changePassword);
user.post("/otp", sentOtp);
user.put("/resetPassword", resetPassword);

module.exports = user;
