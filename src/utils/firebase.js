const admin = require("firebase-admin");
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

module.exports = {
  storage,
  downloadFile: async (downloadUrl) => {
    try {
      const url = new URL(downloadUrl);
      let filePath = url.pathname.replace(/^\/+/, ""); // Remove leading slashes

      // Remove the bucket name from the file path
      const bucketNameIndex = filePath.indexOf("/");
      if (bucketNameIndex !== -1) {
        filePath = filePath.slice(bucketNameIndex + 1);
      }

      filePath = decodeURIComponent(filePath); // Decode URI components

      // Get file reference
      const file = storage.file(filePath);

      // Download file
      const [fileData] = await file.download();

      return fileData;
    } catch (error) {
      console.error("Error downloading file:", error);
      throw new Error("Failed to download file");
    }
  },
  // fetchFileFromFirebase
};
