const { PrismaClient, Role } = require("@prisma/client");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
// const redis = require('redis');

const redisClient = require("../utils/connectRedis")

const prisma = new PrismaClient();

dotenv.config();

// const REDIS_HOST = process.env.REDIS_HOST;
// const REDIS_PORT = process.env.REDIS_PORT;
// const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

// const redisClient = redis.createClient({
//   password: REDIS_PASSWORD,
//     socket: {
//         host: REDIS_HOST,
//         port: REDIS_PORT
//     }
// });
// redisClient.connect()

const saltRounds = 10;

const register = async (req, res) => {
  try {
    const { name, email, password, role, avatar } = req.body;

    const passwordAfterHash = await bcrypt.hash(password, saltRounds);

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
      avatar:avatar
    };

    const createUser = await prisma.user.create({ data: user });

    const admin = {
      userId: createUser.id, // Assuming userId is the foreign key in the Admin table
    };

    await prisma.admin.create({ data: admin });

    res.status(201).json({
      message: "User created successfully",
      user: createUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};


const generateAccessToken = async (name, email, role) => {
  try {
      const token = jwt.sign(
          { data: { name, email, role } },
          process.env.SECRET_KEY,
          { expiresIn: '1h' }
      );

      await redisClient.set('token', token);


      return token; // Return the token here

  } catch (error) {
      console.error(error);
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
          return res.status(404).json({
              message: "User not found",
          });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
          return res.status(401).json({
              message: "Invalid password",
          });
      }

      const token = await generateAccessToken(user.name, user.email, user.role);

      // Send the token back to the client
      res.status(200).json({
          message: "Login successful",
          token: token,
      });

  } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({
          message: "Internal server error",
      });
  }
};


module.exports = { register, login, generateAccessToken };
