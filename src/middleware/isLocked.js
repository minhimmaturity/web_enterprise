const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const isLocked = async (req, res, next) => {
  try {

    const user = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },

    });
    console.log("dấdsdasdasdas", user.email);

    if (user.is_locked) {
      return res.status(403).json({ error: 'Your account is locked.' });
    }

    next();
  } catch (error) {
    console.error('Error checking if user is locked:', error);
    return res.status(500).json({ error: 'Failed to check if user is locked' });
  }
}

module.exports = isLocked;
