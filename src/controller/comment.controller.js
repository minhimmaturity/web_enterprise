const prisma = require('@prisma/client');

const createComment = async (req, res) => {
  const { content, userId, contributionId } = req.body;
  try {
    const comment = await prisma.comment.create({
      data: { content, userId, contributionId },
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getComments = async (req, res) => {
  try {
    const comments = await prisma.comment.findMany();
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getComment = async (req, res) => {
  const { id } = req.params;
  try {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (comment) {
      res.status(200).json(comment);
    } else {
      res.status(404).json({ message: 'Comment not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const comment = await prisma.comment.update({
      where: { id },
      data: { content },
    });
    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteComment = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.comment.delete({ where: { id } });
    res.status(204).json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createComment,
  getComments,
  getComment,
  updateComment,
  deleteComment,
};