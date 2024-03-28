const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const auth = require("./route/user/auth.route");
const admin = require("./route/user/admin.route");
const user = require("./route/user/user.route");
const manager = require("./route/user/manager.route");
const coordinator = require("./route/user/coordinator.route");
const bodyParser = require("body-parser");
const hbs = require("hbs");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
app.use(morgan("combined"));
const prisma = new PrismaClient();
const httpServer = createServer(app); // Attach Express app to HTTP server
const io = new Server(httpServer, {
  /* options */
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);
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
    app.use("/manager", manager);
    app.use("/coordinator", coordinator);
    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id);
    });
    httpServer.listen(PORT, () => {
      console.log(`Server is starting at http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
};

main().catch(console.error);
