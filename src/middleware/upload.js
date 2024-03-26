const multer = require("multer");
const path = require("path");
var appRoot = require("app-root-path");
const { StatusCodes } = require("http-status-codes");
const { getStorage, ref, uploadBytes } = require("firebase/storage");
const storage = require("../utils/firebase");

const multerStorage = multer.memoryStorage();

// const upload = multer({ storage: storageMulter }).fields([
//   { name: "images", maxCount: 10 },
//   { name: "documents", maxCount: 10 },
// ]);

const upload = multer({
  storage: multerStorage,
});

const uploadMiddleware = upload.fields([
  { name: "images", maxCount: 5 },
  { name: "documents", maxCount: 5 },
]);

// const uploadMiddleware = (req, res, next) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       return res.status(400).json({ error: "Error uploading files" });
//     }

//     // Check if files are uploaded
//     if (!req.files || Object.keys(req.files).length === 0) {
//       return res.status(400).json({ error: "No files were uploaded" });
//     }

//     try {
//       const uploadedFiles = [];

//       // Upload image
//       if (req.files.image) {
//         const imageFile = req.files.image[0];
//         const imageName = uuidv4(); // Generate unique name for the image
//         const imageRef = ref(storage, `images/${imageName}`);
//         await uploadBytes(imageRef, imageFile.buffer);
//         uploadedFiles.push({ type: "image", path: `images/${imageName}` });
//       }

//       // Upload document
//       if (req.files.document) {
//         const documentFile = req.files.document[0];
//         const documentName = uuidv4(); // Generate unique name for the document
//         const documentRef = ref(storage, `documents/${documentName}`);
//         await uploadBytes(documentRef, documentFile.buffer);
//         uploadedFiles.push({
//           type: "document",
//           path: `documents/${documentName}`,
//         });
//       }

//       req.uploadedFiles = uploadedFiles; // Save uploaded files info for later use
//       next();
//     } catch (error) {
//       console.error("Error uploading files to Firebase:", error);
//       return res
//         .status(500)
//         .json({ error: "Error uploading files to Firebase" });
//     }
//   });
// };

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     //filter image and document
//     const imageExtensions = /\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/;
//     const documentExtensions = /\.(doc|DOC|pdf|PDF|txt|TXT|xls|xlsx)$/;

//     if (imageExtensions.test(file.originalname)) {
//       cb(null, appRoot + "/upload/images");
//     } else if (documentExtensions.test(file.originalname)) {
//       cb(null, appRoot + "/upload/documents");
//     } else {
//       const error = new Error("Unsupported file type!");
//       return cb(error);
//     }
//   },

//   // config file name
//   filename: function (req, file, cb) {
//     cb(
//       null,
//       file.fieldname + "-" + Date.now() + path.extname(file.originalname)
//     );
//   },
// });

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
