const admin = require("firebase-admin");
const serviceAccount = require("../../web-enterprise-9263a-firebase-adminsdk-nvwy5-71e2e0d334.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "web-enterprise-9263a.appspot.com",
});

const storage = admin.storage().bucket();

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
};
