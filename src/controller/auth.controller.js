const { PrismaClient, Role } = require("@prisma/client");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const redisClient = require("../utils/connectRedis");
const hashPassword = require("../utils/hashPassword");

const prisma = new PrismaClient();

dotenv.config();

const register = async (req, res) => {
  try {
    const { name, email, password, role, avatar } = req.body;

    const passwordAfterHash = await hashPassword(password);

    let userRole;

    if (role === "Admin") {
      userRole = Role.ADMIN;
    }

    const user = {
      name,
      email,
      password: passwordAfterHash,
      role: userRole,
      default_pasword: passwordAfterHash,
      avatar: avatar,
    };

    const createUser = await prisma.user.create({ data: user });

    const admin = {
      userId: createUser.id, // Assuming userId is the foreign key in the Admin table
    };

    await prisma.admin.create({ data: admin });

    res.status(StatusCodes.OK).json({
      message: "User created successfully",
      user: createUser,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal Server Error",
    });
  }
};

const generateAccessToken = async (name, email, role) => {
  try {
    const token = jwt.sign(
      { data: { name, email, role } },
      process.env.SECRET_KEY,
      { expiresIn: "2d" }
    );

    await redisClient.setEx("token" + " " + email, 60 * 60 * 24 * 2, token);

    return token; // Return the token here
  } catch (error) {
    console.error(error);
  }
};

const generateRefreshToken = async (email) => {
  try {
    const refreshToken = jwt.sign(
      { data: { email } },
      process.env.REFRESH_SECRET_KEY,
      { expiresIn: "7d" } // Refresh tokens usually have a longer lifespan
    );

    await redisClient.setEx(
      "refreshToken" + " " + email,
      60 * 60 * 24 * 7,
      refreshToken
    );

    return refreshToken;
  } catch (error) {
    console.error(error);
  }
};
const authToken = async (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(StatusCodes.NOT_FOUND).json({
      errors: [
        {
          msg: "Token not found",
        },
      ],
    });
  }

  try {
    const user = jwt.verify(token, process.env.SECRET_KEY);
    req.user = user.email;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({
        errors: [
          {
            msg: "Expired token",
          },
        ],
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({
        errors: [
          {
            msg: "Invalid token",
          },
        ],
      });
    }
  }
};

const refreshToken = async (token, res, req, next) => {
  try {
    const userInfo = jwt.decode(token, process.env.SECRET_KEY);
    console.log(userInfo);
    const refreshToken = await redisClient.get(
      "refreshToken" + " " + userInfo.data.email
    );
    console.log(userInfo.data.email);
    try {
      const refreshedUser = jwt.verify(
        refreshToken,
        process.env.REFRESH_SECRET_KEY
      );
      const newAccessToken = jwt.sign(
        { data: refreshedUser.data },
        process.env.SECRET_KEY,
        {
          expiresIn: "3d",
        }
      );
      await redisClient.setEx(
        "accessToken" + " " + refreshedUser.data.email,
        60 * 60 * 24 * 3,
        newAccessToken
      );
      req.decodedPayload = refreshedUser;
      req.newAccessToken = newAccessToken;
      res.json({ accessToken: newAccessToken });
    } catch (refreshError) {
      console.error("Error refreshing token:", refreshError);
      return res.status(403).json({ error: "Error refreshing token" });
    }
  } catch (error) {
    console.error("Error verifying access token:", error);
    return res.status(403).json({ error: "Invalid access token" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Invalid password",
      });
    }

    const token = await generateAccessToken(user.name, user.email, user.role);
    const refreshToken = await generateRefreshToken(user.email);

    // Send the tokens back to the client
    res.status(StatusCodes.OK).json({
      message: "Login successful",
      role: user.role,
      token: token,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(StatusCodes.BAD_GATEWAY).json({
      message: "Internal server error",
    });
  }
};

const resetDefaultPassword = async (req, res) => {
  const { email, default_pasword } = req.params;
  const { newPassword, reNewPassword } = req.body;

  const user = await prisma.user.findFirst({ where: { email: email } });
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "User not found",
    });
  }

  const passwordMatch = await bcrypt.compare(default_pasword, user.password);

  if (passwordMatch && newPassword === reNewPassword) {
    const passwordAfterHash = await hashPassword(newPassword);
    const userUpdated = await prisma.user.update({
      where: { email: email },
      data: {
        password: passwordAfterHash,
        updatedAt: new Date().toISOString(),
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "Password reset successful",
      user: userUpdated,
    });
  } else {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Invalid password",
    });
  }
};

module.exports = {
  register,
  login,
  generateAccessToken,
  generateRefreshToken,
  refreshToken,
  authToken,
  resetDefaultPassword,
};
