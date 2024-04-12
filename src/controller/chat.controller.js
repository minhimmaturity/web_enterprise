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
        body: {
          message: "User not found",
        },
      };
      return res.status(response.statusCode).json(response.body);
    }

    const data = { userId: user.id };
    const createConversation = await prisma.conversation.create({
      data: data,
    });

    const response = {
      statusCode: StatusCodes.OK,
      body: {
        message: "Conversation created successfully",
        conversation: createConversation,
      },
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
      body: {
        message: "user are in chat successfully",
        conservation: userAreInChat,
      },
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

  const message = await prisma.message.create({ data: data });
  const response = {
    statusCode: 200,
    body: {
      message: "sent message successfully",
      message: message,
    },
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
        conversationId: conversationId,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        text: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            createAt: true,
          },
        },
      },
    });
    return messages;
  } catch (error) {
    console.error("Error retrieving messages:", error);
    throw error;
  }
};

const editMessage = async (messageId, text) => {
  try {
    const message = await prisma.message.update({
      where: { id: messageId },
      data: { text: text },
    });

    const response = {
      statusCode: 200,
      body: {
        message: "edit message successfully",
        message: message,
      },
    };
    return response;
  } catch (error) {
    console.error("Error retrieving messages:", error);
    throw error;
  }
};

const getAllConversationByUserId = async (userEmail, req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
    });

    const response = {
      statusCode: StatusCodes.OK,
      conversations: conversations,
    };
    return response;
  } catch (error) {
    console.log(error.message);
  }
};

const findExistConversation = async (users) => {
  const userIds = users.split(",").map((id) => id.trim());

  // Fetch the conversation IDs for each user
  const conversationIds = await Promise.all(
    userIds.map(async (userId) => {
      const user = await prisma.userOnConservation.findFirst({
        where: { userId },
      });
      return user?.conversationId;
    })
  );

  // Check if all users have the same conversation ID
  const allInSameConversation = conversationIds.every(
    (conversationId) => conversationId === conversationIds[0]
  );

  if (allInSameConversation && conversationIds[0]) {
    // If all users are in the same conversation, return the conversation ID
    return conversationIds[0];
  } else {
    // If users are not in the same conversation, return null or handle as needed
    return null;
  }
};


module.exports = {
  createConversation,
  addUserIntoConservation,
  sentMessage,
  validateUserInConversation,
  getMessagesInConversation,
  editMessage,
  getAllConversationByUserId,
  findExistConversation,
};
