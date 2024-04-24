const multer = require("multer");
const { StatusCodes } = require("http-status-codes");
const storage = require("../utils/firebase");

const multerStorage = multer.memoryStorage();

const upload = multer({
  fileFilter: (req, res, file, cb) => {
    // Check if the file is a docx file or an image
    const allowedExtensions = [".docx", ".jpg", ".jpeg", ".png", ".gif"];
    const fileExtension =
      "." + file.originalname.split(".").pop().toLowerCase();

    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true); // Accept the file
    } else {
      cb(
        res.json("Only .docx, .jpg, .jpeg, .png, and .gif files are allowed"),
        false
      ); // Reject the file
    }
  },
  storage: multerStorage,
});

const uploadMiddleware = upload.fields([{ name: "files", maxCount: 5 }]);

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
