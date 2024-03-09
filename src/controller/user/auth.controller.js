const { PrismaClient, Role } = require("@prisma/client");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

dotenv.config();

const saltRounds = 10;

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const passwordAfterHash = await bcrypt.hash(password, saltRounds);

    console.log(passwordAfterHash);

    let userRole = Role.USER;

    if (role === "Admin") {
      userRole = Role.ADMIN;
    }

    const user = {
      name,
      email,
      password: passwordAfterHash,
      role: userRole,
    };

    const createUser = await prisma.user.create({ data: user });

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

const generateAccessToken = (name, email, role) => {
  try {
    const token = jwt.sign(
      { data: { name, email, role } },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    return {
      message: "Created access token successfully",
      token: token,
    };
  } catch (error) {
    console.error(error);
    return {
      error: error.message || "Internal server error",
    };
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

    const token = generateAccessToken(user.name, user.email, user.role);

    // Send the token back to the client
    res.status(200).json({
      message: "login successfully",
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
