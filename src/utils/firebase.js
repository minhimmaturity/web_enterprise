const admin = require("firebase-admin");
const fetch = require("node-fetch");
const path = require("path");
const serviceAccount = require("../../web-enterprise-9263a-firebase-adminsdk-nvwy5-71e2e0d334.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "web-enterprise-9263a.appspot.com",
});

const storage = admin.storage().bucket();

// const fetchFileFromFirebase = async (filePath) => {
//   try {
//     const file = storage.file(filePath);
//     const [url] = await file.getSignedUrl({ action: "read", expires: "03-17-2025" })
//     return url;
//   } catch (error) {
//     console.error("Error fetching file from Firebase:", error);
//     throw error;
//   }
// };

// const fetchFileFromFirebase = async (filePath, fileName) => {
//   try {
//     const response = await fetch(filePath);
//     const blob = await response.blob();
//     const fetchedFile = new File([blob], fileName); // Specify filename here
//     setFile(fetchedFile);
//   } catch (error) {
//     console.error('Error fetching file:', error);
//   }
// };

const downloadFile = async (downloadUrl) => {
  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      res.status(StatusCodes.BAD_GATEWAY).json({
        message: "Failed to download file",
      });
    }
    const fileData = await response.buffer();
    return fileData;
  } catch (error) {
    console.error("Error downloading file:", error);
    throw new Error("Failed to download file");
  }
};

module.exports = {
  storage,
  downloadFile,
  // fetchFileFromFirebase
};
