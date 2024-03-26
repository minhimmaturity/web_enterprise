const admin = require("firebase-admin");
const serviceAccount = require("../../web-enterprise-9263a-firebase-adminsdk-nvwy5-71e2e0d334.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "web-enterprise-9263a.appspot.com",
});

const storage = admin.storage().bucket();

module.exports = storage;
