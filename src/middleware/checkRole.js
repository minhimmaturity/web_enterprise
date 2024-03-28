const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const redisClient = require("../utils/connectRedis");
const { refreshToken } = require("../controller/auth.controller");

const authMiddleware = (allowedRoles) => async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Token not provided" });

    let decodedPayload;
    let userEmail;
    try {
      decodedPayload = jwt.verify(token, process.env.SECRET_KEY);
      userEmail = decodedPayload.data.email;
      console.log(userEmail);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return refreshToken(token, res, req, next);
      } else {
        return res.status(403).json({ error: "Invalid access token" });
      }
    }

    console.log("Decoded Payload:", decodedPayload); // Log decoded payload
    req.decodedPayload = decodedPayload;

    const user = await prisma.user.findUnique({
      where: { email: decodedPayload.data.email },
    });

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "User is not authorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error in auth middleware:", error);
    return res.sendStatus(403);
  }
};

module.exports = { authMiddleware };
