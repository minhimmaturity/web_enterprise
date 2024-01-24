const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
app.use(morgan("combined"));
const prisma = new PrismaClient();

const HOST = process.env.HOST;
const PORT = process.env.PORT;

const main = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server is starting at http://${HOST}:${PORT}`);
        });
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
};

try {
    main();
} catch (e) {
    console.error(e);
    process.exit(1);
}
