const multer = require("multer");
const path = require("path");
var appRoot = require("app-root-path");

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

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(StatusCodes.BAD_GATEWAY).json({ message: err.message });
  } else {
    res.status(StatusCodes.BAD_GATEWAY).json({ message: err.message });
  }
};

module.exports = { uploadMultipleFiles, handleUploadError };
