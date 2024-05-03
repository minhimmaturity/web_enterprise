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
const guest = require("./route/user/guest.route");
const admin = require("./route/user/admin.route");
const user = require("./route/user/user.route");
const chat = require("./route/chat/chat.route");
const manager = require("./route/user/manager.route");
const coordinator = require("./route/user/coordinator.route");
const comment = require("./route/user/comment.route");
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
  editMessage,
  getAllConversationsWithLatestMessage,
  findExistConversation,
  // returnConversationAndLastestMessage
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
app.use("/guest", guest);

const httpServer = createServer(app);

// Attach Socket.IO to the existing HTTP server
const io = new Server(httpServer, {
  cors: {
    credentials: true,
  },
});

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

  // Handle joining a conversation
  socket.on("join", async (data) => {
    const { users } = data;
  
    const existRoom = await findExistConversation(users);
  
    if (existRoom) {
      // If there's an existing conversation involving all users
      const messageInRoom = await getMessagesInConversation(existRoom);
      const response = {
        message: messageInRoom,
        room: existRoom
      };
      await socket.emitWithAck("join-room-response", response);
    } else {
      // If there's no existing conversation involving all users
      const room = await createConversation(user.email);
      const userInConversation = await addUserIntoConservation(
        users,
        room.body.conversation.id
      );
      const response = {
        userInConversation: userInConversation,
        room: room.body.conversation.id
      };
      await socket.emitWithAck("join-room-response", response);
    }
  });
  

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
          const message = await sentMessage(userId, conversationId, fileUrl);

          socket.emitWithAck("message-sent", message);

          return fileUrl;
        });
        await Promise.all(fileUploadPromises);
      }
      if (!text) {
        return;
      }
      const message = await sentMessage(userId, conversationId, text);
      socket.emitWithAck("message-sent", message);

      // Broadcast the message to all clients in the conversation room
    } else {
      socket.emit(
        "error",
        "You are not authorized to send messages in this conversation."
      );
    }
  });

  socket.on("get-message", async (data) => {
    const { conversationId } = data;

    try {
      const messages = await getMessagesInConversation(conversationId);
      // Send the retrieved messages back to the client
      socket.emitWithAck("get-message-response", messages);
    } catch (error) {
      // Handle the error, for example:
      socket.emitWithAck("error", "Error retrieving messages");
    }
  });

  socket.on("edit-message", async (data) => {
    const { conversationId, userId, messageId, updatedFiles, text } = data;

    try {
      // Validate if the user is authorized to send messages in this conversation
      const userInConversation = await validateUserInConversation(userId);
      if (!userInConversation) {
        socket.emit(
          "error",
          "You are not authorized to send messages in this conversation."
        );
        return;
      }

      // Upload updated files
      if (updatedFiles && updatedFiles.length > 0) {
        const fileUploadPromises = updatedFiles.map(async (file) => {
          const filePath = `chat/files/${conversationId}/${file.filename}`;
          const blob = bucket.file(filePath);

          // Convert base64 encoded content to a buffer
          const buffer = Buffer.from(file.content, "base64");

          // Upload file to Firebase Storage
          await blob.save(buffer, {
            metadata: {
              contentType: file.mimetype,
            },
          });

          const [fileUrl] = await blob.getSignedUrl({
            action: "read",
            expires: "03-17-2025",
          });

          // Update message with the new file URL
          const message = await editMessage(messageId, fileUrl);

          await socket.emitWithAck("edit-message-response", message);

          return fileUrl;
        });

        await Promise.all(fileUploadPromises);
      }

      // Broadcast that the file update is complete
      if (!text) {
        return;
      }
      const message = await editMessage(messageId, text);
      socket.emitWithAck("edit-message-response", message);
    } catch (error) {
      console.error("Error updating file:", error);
      socket.emit("error", "Error updating file");
    }
  });

  socket.on("get-conversation", async() => {
    const conversation = await getAllConversationsWithLatestMessage(user.email)

    await socket.emitWithAck("get-conversation-response", conversation)
  })

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

process.on("SIGTERM", () => {
  httpServer.close(() => {
    console.log("Process terminated");
    prisma.$disconnect();
  });
});
