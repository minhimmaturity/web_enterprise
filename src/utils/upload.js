const multer = require("multer");
const path = require("path");
var appRoot = require("app-root-path");
const { StatusCodes } = require("http-status-codes");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Filter image and document
    const imageExtensions = /\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/;
    const documentExtensions = /\.(doc|DOC|pdf|PDF|txt|TXT|xls|xlsx|docx)$/;

    if (imageExtensions.test(file.originalname)) {
      cb(null, appRoot + "/upload/images");
    } else if (documentExtensions.test(file.originalname)) {
      cb(null, appRoot + "/upload/documents");
    } else {
      const error = new Error("Unsupported file type!");
      return cb(error);
    }
  },
  
  // Configure filename
  filename: function (req, file, cb) {
    if (file.fieldname === "files" && /\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/.test(file.originalname)) {
      cb(
        null,
        "image-" + Date.now() + path.extname(file.originalname)
      );
    } else {
      cb(
        null,
        "document-"+ Date.now() + path.extname(file.originalname)
      );
    }
  },
});

const uploadMultipleFiles = multer({
  storage: storage,
}).fields([
  { name: "files", maxCount: 10 }
]);

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(StatusCodes.BAD_GATEWAY).json({ message: err.message });
  } else {
    res.status(StatusCodes.BAD_GATEWAY).json({ message: err.message });
  }
};

module.exports = { uploadMultipleFiles, handleUploadError };
