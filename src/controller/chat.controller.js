const express = require("express");
const { PrismaClient, Role } = require("@prisma/client");
const dotenv = require("dotenv");
const prisma = new PrismaClient();
const { StatusCodes } = require("http-status-codes");
const user = require("../route/user/user.route");

const createConversation = async (userEmail, req, res) => {
  try {
    const user = await prisma.user.findFirst({ where: { email: userEmail } });
    if (!user) {
      const response = {
        statusCode: StatusCodes.NOT_FOUND,
        body: JSON.stringify({
          message: "User not found",
        }),
      };
      return res.status(response.statusCode).json(JSON.parse(response.body));
    }

    const data = { userId: user.id };
    const createConversation = await prisma.conversation.create({
      data: data,
    });

    const response = {
      statusCode: StatusCodes.OK,
      body: JSON.stringify({
        message: "Conversation created successfully",
        conversation: createConversation,
      }),
    };
    return response;
  } catch (error) {
    console.error(error.message);
    const response = {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({
        message: "Error creating conversation",
      }),
    };
    return res.status(response.statusCode).json(JSON.parse(response.body));
  }
};

const addUserIntoConservation = async (users, conversationId, req, res) => {
  try {
    let userToChat = [];
    // let studentIds = req.body.StudentId.split(",").map((id) => id.trim());
    const user = users.split(",").map((id) => id.trim());
    user.map((u) => {
      console.log(u);
      const data = {
        userId: u,
        conversationId: conversationId,
      };

      userToChat.push(data);
    });

    const userAreInChat = await prisma.userOnConservation.createMany({
      data: userToChat,
    });
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "user are in chat successfully",
        conservation: userAreInChat,
      }),
    };
    return response;
  } catch (error) {
    console.log(error.message);
  }
};

const sentMessage = async (userId, conversationId, text, req, res) => {
  const data = {
    userId: userId,
    conversationId: conversationId,
    text: text,
  };

  const message = await prisma.message.createMany({ data: data });
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: "sent message successfully",
      message: message,
    }),
  };

  return response;
};

const validateUserInConversation = async (userId, conversationId, req, res) => {
  const userInConversation = await prisma.userOnConservation.findMany({
    where: { userId: userId, conversationId: conversationId },
  });
  if (!userInConversation) {
    // Handle the case where the user is not authorized to send messages in this conversation
    return false;
  }
  return true;
};

const getMessagesInConversation = async (conversationId) => {
  try {
      const messages = await prisma.message.findMany({
          where: {
              conversationId: conversationId
          },
          orderBy: {
              createdAt: 'asc' // You can change this to 'desc' if you want to order messages by descending order
          },
          include: {
              sender: true // Include the sender details if needed
          }
      });
      return messages;
  } catch (error) {
      console.error("Error retrieving messages:", error);
      throw error;
  }
};

module.exports = { createConversation, addUserIntoConservation, sentMessage, validateUserInConversation, getMessagesInConversation };
