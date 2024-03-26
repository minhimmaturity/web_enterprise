const multer = require("multer");
const path = require("path");
var appRoot = require("app-root-path");
const { StatusCodes } = require("http-status-codes");
const { getStorage, ref, uploadBytes } = require("firebase/storage");
const storage = require("../utils/firebase");

const multerStorage = multer.memoryStorage();

const upload = multer({
  storage: multerStorage,
});

const uploadMiddleware = upload.fields([
  { name: "files", maxCount: 5 }
]);

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(StatusCodes.BAD_GATEWAY).json({ message: err.message });
  } else {
    res.status(StatusCodes.BAD_GATEWAY).json({ message: err.message });
  }
};

module.exports = {
  // uploadMultipleFiles,
  handleUploadError,
  // handleUploadFiles,
  // documentUpload,
  // imageUpload,
  uploadMiddleware,
};
