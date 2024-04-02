const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const hbs = require("hbs");
const cors = require("cors");
const { Server } = require("socket.io");
const { createServer } = require("http");

// Import route handlers and controllers
const auth = require("./route/user/auth.route");
const admin = require("./route/user/admin.route");
const user = require("./route/user/user.route");
const chat = require("./route/chat/chat.route");
const manager = require("./route/user/manager.route");
const coordinator = require("./route/user/coordinator.route");
const comment = require("./route/comment.route");

// Import controller functions for WebSocket events
const {
  addUserIntoConservation,
  sentMessage,
  createConversation,
} = require("./controller/chat.controller");
const { authenticateSocket } = require("./middleware/checkRole");

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

// Use your existing route handlers
app.use("/user", user);
app.use("/auth", auth);
app.use("/admin", admin);
app.use("/manager", manager);
app.use("/coordinator", coordinator);
app.use("/chat", chat);
app.use("/comment", comment);

const httpServer = createServer(app);

// Attach Socket.IO to the existing HTTP server
const io = new Server(httpServer, {
  cors: {
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const authHeader = socket.handshake.headers.access_token;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return next(new Error("Token not provided"));
    }

    let decodedPayload;
    let userEmail;
    try {
      decodedPayload = jwt.verify(token, process.env.SECRET_KEY);
      userEmail = decodedPayload.data.email;
      console.log(userEmail);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return next(new Error("Token expired"));
      } else {
        return next(new Error("Invalid access token"));
      }
    }

    console.log("Decoded Payload:", decodedPayload); // Log decoded payload
    socket.userEmail = userEmail;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error("Error in socket authentication:", error);
    next(error);
  }
});

// Handle WebSocket connections
io.use(async (socket, next) => {
  try {
    const authHeader = socket.handshake.headers.authorization; // Change header field to 'authorization'
    console.log(authHeader);
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return next(new Error("Token not provided"));
    }

    let decodedPayload;
    let userEmail;
    try {
      decodedPayload = jwt.verify(token, process.env.SECRET_KEY);
      userEmail = decodedPayload.data.email;
      console.log(userEmail);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return next(new Error("Token expired"));
      } else {
        return next(new Error("Invalid access token"));
      }
    }

    console.log("Decoded Payload:", decodedPayload); // Log decoded payload
    socket.userEmail = userEmail;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error("Error in socket authentication:", error);
    next(error);
  }
});

httpServer.listen(process.env.PORT, () => {
  console.log(
    `Server is starting at http://${process.env.HOST}:${process.env.PORT}`
  );
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Optionally, attempt to gracefully shut down connections, close database connections, etc.
  // Then restart the server
  console.log("Restarting server...");
  httpServer.close(() => {
    httpServer.listen(process.env.PORT, () => {
      console.log(
        `Server is starting at http://${process.env.HOST}:${process.env.PORT}`
      );
    });
  });
});

const terminationSignals = ["SIGINT", "SIGTERM", "SIGQUIT"];

terminationSignals.forEach((signal) => {
  process.on(signal, () => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    // Optionally, attempt to gracefully shut down connections, close database connections, etc.
    httpServer.close(() => {
      console.log("Server shut down.");
      process.exit(0);
    });
  });
});

process.on("SIGTERM", () => {
  httpServer.close(() => {
    console.log("Process terminated");
    prisma.$disconnect();
  });
});
