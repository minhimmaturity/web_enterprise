const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const hbs = require("hbs");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");

// Import route handlers and controllers
const auth = require("./route/user/auth.route");
const admin = require("./route/user/admin.route");
const user = require("./route/user/user.route");
const chat = require("./route/chat/chat.route");
const manager = require("./route/user/manager.route");
const coordinator = require("./route/user/coordinator.route");

// Import controller functions for WebSocket events
const { addUserIntoConservation, sentMessage } = require("./controller/chat.controller");

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

const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server);

// Handle WebSocket connections
io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle joining a conversation
  socket.on("join", async (data) => {
    const { userId1, userId2, conversationId } = data;
    await addUserIntoConservation(userId1, userId2, conversationId);
  });

  // Handle sending a message
  socket.on("message", async (data) => {
    const { conversationId, userId, text } = data;
    await sentMessage(userId, conversationId, text);

    // Broadcast the message to all clients in the conversation
    io.emit("message", data);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});


server.listen(process.env.PORT, process.env.HOST, () => {
  console.log(`Server is starting at http://${process.env.HOST}:${process.env.PORT}`);
});

// Use your existing route handlers
app.use("/user", user);
app.use("/auth", auth);
app.use("/admin", admin);
app.use("/manager", manager);
app.use("/coordinator", coordinator);
app.use("/chat", chat);

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Process terminated');
    prisma.$disconnect();
  });
});
