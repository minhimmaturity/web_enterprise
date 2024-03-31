const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const auth = require("./route/user/auth.route");
const admin = require("./route/user/admin.route");
const user = require("./route/user/user.route");
const chat = require("./route/chat/chat.route");
const manager = require("./route/user/manager.route");
const coordinator = require("./route/user/coordinator.route");
const bodyParser = require("body-parser");
const hbs = require("hbs");
const cors = require("cors");
const WebSocket = require('ws');
const { join } = require('path');

dotenv.config();

const app = express();
app.use(morgan("combined"));
const prisma = new PrismaClient();

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

const server = app.listen(process.env.PORT, process.env.HOST, () => {
  console.log(`Server is starting at http://${process.env.HOST}:${process.env.PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.use("/user", user);
app.use("/auth", auth);
app.use("/admin", admin);
app.use("/manager", manager);
app.use("/coordinator", coordinator);
app.use("/chat", chat)

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Process terminated');
    prisma.$disconnect();
  });
});
