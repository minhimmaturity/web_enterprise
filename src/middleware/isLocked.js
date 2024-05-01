const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const isLocked = async (req, res, next) => {
  try {
    let user;
    if (!req.decodedPayload) {
      const { email } = req.body;
      user = await prisma.user.findFirst({
        where: { email: email },
      });

      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: "User not found in the database",
        });
      }
    } else {
      user = await prisma.user.findFirst({
        where: { email: req.decodedPayload.data.email },
      });

      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: "User not found in the database",
        });
      }

      if (user.is_locked) {
        return res.status(StatusCodes.FORBIDDEN).json({
          error: "User is locked",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Error checking if user is locked:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to check if user is locked: " + error.message });
  }
};




module.exports = isLocked;
