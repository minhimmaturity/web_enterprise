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
const jwt = require("jsonwebtoken");
const { storage } = require("./utils/firebase");
const bucket = storage;

// Import controller functions for WebSocket events
const {
  addUserIntoConservation,
  sentMessage,
  createConversation,
  validateUserInConversation,
  getMessagesInConversation,
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

// Register middleware for socket authentication
// io.use(async (socket, next) => {
//   try {

//     next();
//   } catch (error) {
//     console.error("Error in socket authentication:", error);
//     next(error);
//   }
// });

// Connection event handler
io.on("connection", async (socket) => {
  const authHeader = socket.handshake.headers["access-token"];

  if (!authHeader) {
    console.error("Token not provided");
    return;
  }

  let decodedPayload;
  let userEmail;
  try {
    decodedPayload = jwt.verify(authHeader, process.env.SECRET_KEY);

    userEmail = decodedPayload.data.email;
    console.log("User email:", userEmail);
  } catch (error) {
    console.error("Error verifying token:", error.message);
    return;
  }

  console.log("Decoded Payload:", decodedPayload); // Log decoded payload

  socket.userEmail = userEmail;

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    console.error("User not found");
    return;
  }

  socket.user = user;

  console.log("A user connected:", user.email); // Access userEmail from socket object

  // Handle room join
  socket.on("create-room", async () => {
    await createConversation(user.email);
  });

  // Handle joining a conversation
  socket.on("join", async (data) => {
    const { users, conversationId } = data;
    socket.join(conversationId);

    await addUserIntoConservation(users, conversationId);
  });

  // Handle sending a message
  // socket.on("message", async (data) => {
  //   const { conversationId, userId, text, files } = data;
  //   const userInConvertsation = await validateUserInConversation(userId);
  //   if(userInConvertsation) {
  //     if (files && files.length > 0) {
  //       const fileUploadPromises = files.map(async (file) => {
  //         const filePath = `chat/files/${conversationId}/${file.filename}`; // Use filename instead of originalname
  //         const blob = bucket.file(filePath);

  //         // Convert base64 encoded content to a buffer
  //         const buffer = Buffer.from(file.content, "base64");

  //         // Upload file to Firebase Storage
  //         await blob.save(buffer, {
  //           // Use buffer instead of file.buffer
  //           metadata: {
  //             contentType: file.mimetype,
  //           },
  //         });
  //         const [fileUrl] = await blob.getSignedUrl({
  //           action: "read",
  //           expires: "03-17-2025",
  //         });

  //         // Save file URL to database
  //         await sentMessage(userId, conversationId, fileUrl);

  //         return fileUrl;
  //       });
  //       await Promise.all(fileUploadPromises);
  //     }
  //     if (!text) {
  //       return;
  //     }
  //     await sentMessage(userId, conversationId, text);
  //   } else {
  //     socket.emit("error", "You are not authorized to send messages in this conversation.");
  //   }

  //   // Broadcast the message to all clients in the conversation
  // });

  socket.on("message", async (data) => {
    const { conversationId, userId, text, files } = data;
    const userInConvertsation = await validateUserInConversation(userId);
    if (userInConvertsation) {
      if (files && files.length > 0) {
        const fileUploadPromises = files.map(async (file) => {
          const filePath = `chat/files/${conversationId}/${file.filename}`; // Use filename instead of originalname
          const blob = bucket.file(filePath);

          // Convert base64 encoded content to a buffer
          const buffer = Buffer.from(file.content, "base64");

          // Upload file to Firebase Storage
          await blob.save(buffer, {
            // Use buffer instead of file.buffer
            metadata: {
              contentType: file.mimetype,
            },
          });
          const [fileUrl] = await blob.getSignedUrl({
            action: "read",
            expires: "03-17-2025",
          });

          // Save file URL to database
          await sentMessage(userId, conversationId, fileUrl);

          return fileUrl;
        });
        await Promise.all(fileUploadPromises);
      }
      if (!text) {
        return;
      }
      await sentMessage(userId, conversationId, text);

      // Broadcast the message to all clients in the conversation room
      socket.to(conversationId).emit("message", {
        userId,
        conversationId,
        text,
        files,
      });
    } else {
      socket.emit(
        "error",
        "You are not authorized to send messages in this conversation."
      );
    }
  });

  socket.on("get-message", async (data) => {
    const { conversationId } = data;

    console.log(socket.rooms);

    try {
      const messages = await getMessagesInConversation(conversationId);
      // Send the retrieved messages back to the client
      socket.emitWithAck("get-message-response", messages);
    } catch (error) {
      // Handle the error, for example:
      socket.emitWithAck("error", "Error retrieving messages");
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
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
