const redis = require("redis");
const dotenv = require("dotenv");

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

const redisClient = redis.createClient({
  password: REDIS_PASSWORD,
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});
try {
  redisClient.connect();
} catch (err) {
  console.log(err.message);
}

module.exports = redisClient;
