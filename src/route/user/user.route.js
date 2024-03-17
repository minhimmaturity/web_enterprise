const multer = require("multer");
const path = require("path");
const express = require("express");
var appRoot = require("app-root-path");
const { Router } = express;
const {
  editUserProfile,
  changePassword,
  sentOtp,
  resetPassword,
  uploadContribution,
  viewMyContributions,
} = require("../../controller/user.controller");
const user = Router();

// Other routes...

user.put("/editProfile", editUserProfile);
user.put("/changePassword", changePassword);
user.post("/otp", sentOtp);
user.put("/resetPassword", resetPassword);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    //filter image and document
    const imageExtensions = /\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/;
    const documentExtensions = /\.(doc|DOC|pdf|PDF|txt|TXT|xls|xlsx)$/;

    if (imageExtensions.test(file.originalname)) {
      cb(null, appRoot + "/upload/images");
    } else if (documentExtensions.test(file.originalname)) {
      cb(null, appRoot + "/upload/documents");
    } else {
      const error = new Error("Unsupported file type!");
      return cb(error);
    }
  },

  // config file name
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const uploadMultipleFiles = multer({
  storage: storage,
}).fields([
  { name: "image", maxCount: 10 },
  { name: "document", maxCount: 10 },
]);

const handleError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ message: err.message });
  } else {
    res.status(400).json({ message: err.message });
  }
};

// Route for uploading submission
user.post(
  "/uploadContribution",
  (req, res, next) => {
    uploadMultipleFiles(req, res, (err) => {
      if (err) {
        handleError(err, req, res, next);
      } else {
        next();
      }
    });
  },
  uploadContribution
);

user.get("/viewMyContributions", viewMyContributions);

module.exports = user;
