const { StatusCodes } = require('http-status-codes');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const createComment = async (req, res) => {
  const { contributionId } = req.params;
  const { content } = req.body;

  try {
    const currentUser = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },
    });
    if (!currentUser) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }
  
    const comment = await prisma.comment.create({
      data: { content, userId: currentUser.id, contributionId },
    });
    res.status(StatusCodes.CREATED).json(comment);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  } finally {
    await prisma.$disconnect();
  }
};

const getCommentsByContributionId = async (req, res) => {
  const { contributionId } = req.params;
  try {
    const comments = await prisma.comment.findMany({
      where: { contributionId },
    });
    res.status(StatusCodes.OK).json(comments);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

const getComment = async (req, res) => {
  const { id } = req.params;
  try {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (comment) {
      res.status(StatusCodes.OK).json(comment);
    } else {
      res.status(StatusCodes.NOT_FOUND).json({ message: 'Comment not found' });
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

const updateComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const currentUser = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },
    });
    if (!currentUser) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Comment not found",
      });
    }

    // Check if the current user is the creator of the comment
    if (comment.userId !== currentUser.id) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: "You are not authorized to update this comment",
      });
    }

    // If the user is authorized, proceed with updating the comment
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content },
    });
    res.status(StatusCodes.OK).json(updatedComment);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};


const deleteComment = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.comment.delete({ where: { id } });
    res.status(StatusCodes.NO_CONTENT).json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

module.exports = {
  createComment,
  getCommentsByContributionId,
  getComment,
  updateComment,
  deleteComment,
};
