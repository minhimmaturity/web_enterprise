const express = require("express");
const { PrismaClient, Role } = require("@prisma/client");
const dotenv = require("dotenv");
const prisma = new PrismaClient();
const { StatusCodes } = require("http-status-codes");

const createConversation = async (req, res) => {
  try {
    const data = {};
    const createConservation = await prisma.conversation.create({ data: data });
    res.status(StatusCodes.OK).json({
      message: "create chat successfully",
      conservation: createConservation,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addUserIntoConservation = async (
  userId1,
  userId2,
  conversationId,
  req,
  res
) => {
  try {
    const data = [
      { userId: userId1, conversationId: conversationId },
      { userId: userId2, conversationId: conversationId },
    ];

    console.log(data);

    const userAreInChat = await prisma.userOnConservation.createMany({
      data: data,
    });

    console.log(userAreInChat);
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

  const message = await prisma.message.create({ data: data });
  const response = {
    statusCode: 200,
    body: JSON.stringify({ message: "sent message successfully", message: message })
  };

  return response;
};


module.exports = { createConversation, addUserIntoConservation, sentMessage };
