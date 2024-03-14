const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    const decodedPayload = jwt.verify(token, process.env.SECRET_KEY);
    console.log('Decoded Payload:', decodedPayload); // Log decoded payload

    const user = await prisma.user.findUnique({
        where: { email: decodedPayload.data.email },
      });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'User is not an admin' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error in admin middleware:', error);
    return res.sendStatus(403);
  }
};

module.exports = { adminMiddleware };
