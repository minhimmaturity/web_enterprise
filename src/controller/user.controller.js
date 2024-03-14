const { PrismaClient, Role } = require("@prisma/client");
const dotenv = require("dotenv");
const hashPassword = require("../utils/hashPassword");

dotenv.config;

const prisma = new PrismaClient();
