const { initializeApp } = require("firebase/app");
const { getStorage } = require("firebase/storage");

const firebaseConfig = {
  apiKey: "AIzaSyDNpMsLD_VlN4jCMhWXEnroXDX5OjB7PVQ",
  authDomain: "web-enterprise-9263a.firebaseapp.com",
  projectId: "web-enterprise-9263a",
  storageBucket: "web-enterprise-9263a.appspot.com",
  messagingSenderId: "840143889816",
  appId: "1:840143889816:web:048971c6766cf1087237ed",
  measurementId: "G-1VFMSMBHRV"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

module.exports = storage;