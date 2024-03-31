const express = require("express");
const { createConversation, addUserIntoConservation,sentMessage } = require("../../controller/chat.controller");
const { Router } = express;

const chat = Router();
chat.use(express.json());

chat.post("/create", createConversation)
chat.post("/userInChat", addUserIntoConservation)
chat.post("/sentMessage", sentMessage)

module.exports = chat

