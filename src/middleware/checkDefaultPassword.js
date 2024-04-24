const { PrismaClient, Role } = require("@prisma/client");
const { StatusCodes } = require("http-status-codes");

const prisma = new PrismaClient();

const checkDefaultPassword = async (req, res, next) => {
  let user;
  if(!req.decodedPayload) {
    const { email } = req.body;
    user = await prisma.user.findUnique({
      where: { email: email },
    });
  } else {
    user = await prisma.user.findUnique({
      where: { email: req.decodedPayload.data.email },
    });
    if(!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }
  }
  
  if (user.password === user.default_pasword && user.role != Role.ADMIN) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Please change your password",
    });
  }

  next();
};

module.exports = checkDefaultPassword;
