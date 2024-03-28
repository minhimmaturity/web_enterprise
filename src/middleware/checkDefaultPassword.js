const { PrismaClient } = require("@prisma/client");
const { StatusCodes } = require("http-status-codes");

const prisma = new PrismaClient();

const checkDefaultPassword = async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { email: req.decodedPayload.data.email },
  });

  if (user.password === user.default_pasword) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Please change your password",
    });
  }

  next();
};

module.exports = checkDefaultPassword;
