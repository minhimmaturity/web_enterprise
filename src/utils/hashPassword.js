const bcrypt = require("bcrypt");

const saltRounds = 10;

const hashPassword = async (password) => {
  try {
    const passwordAfterHash = await bcrypt.hash(password, saltRounds);
    return passwordAfterHash;
  } catch (err) {
    console.log(err.message);
  }
};

module.exports = hashPassword;
