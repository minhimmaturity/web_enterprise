const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const auth = require("./route/user/auth.route");
const admin = require("./route/user/admin.route");
const user = require("./route/user/user.route");
const bodyParser = require("body-parser");
const hbs = require("hbs");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(morgan("combined"));
const prisma = new PrismaClient();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.enableCors({
  origin: true, // Set it to true to allow all origins or provide a specific origin or an array of origins
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ], // Allowed request headers
});
app.set("view engine", "hbs");
hbs.registerHelper("helper_name", function (options) {
  return "helper value";
});
hbs.registerPartial("partial_name", "partial value");

const HOST = process.env.HOST;
const PORT = process.env.PORT;

const main = async () => {
  try {
    app.use("/user", user);
    app.use("/auth", auth);
    app.use("/admin", admin);
    app.listen(PORT, () => {
      console.log(`Server is starting at http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
};

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
