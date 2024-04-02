const express = require("express");
const { createConversation, addUserIntoConservation,sentMessage } = require("../../controller/chat.controller");
const { authMiddleware } = require("../../middleware/checkRole");
const { Role } = require("@prisma/client");
const { Router } = express;

const chat = Router();
chat.use(express.json());

chat.post("/create",authMiddleware([Role.MANAGER]), createConversation)
chat.post("/userInChat", addUserIntoConservation)
chat.post("/sentMessage", sentMessage)

module.exports = chat

