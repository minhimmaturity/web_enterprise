const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const dotenv = require("dotenv");
const path = require("path");
const hbs = require("hbs");
const otpGenerator = require("otp-generator");
const redisClient = require("./connectRedis");

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "trantanminh0603@gmail.com",
    pass: "fqubckfknczveman",
  },
});

const sendMailToUser = async (email, password, name) => {
  // Resolve the path to the template file
  const templatePath = path.resolve(__dirname, "../../mail/template.hbs");

  // Read the HTML template file
  const htmlTemplate = fs.readFileSync(templatePath, "utf8");
  const template = hbs.compile(htmlTemplate);

  const compiledHTML = template({
    userName: name,
    userEmail: email,
    userPassword: password,
    loginUrl: "https://example.com/login",
  });

  const mailOptions = {
    from: "trantanminh0603@gmail.com",
    to: email,
    subject: "do not reply",
    html: compiledHTML,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

const sendMailResetPassword = async (email) => {
  const token = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    digits: true,
    specialChars: false,
  });

  await redisClient.setEx("otp" + " " + email, 60, token);
  // Resolve the path to the template file
  const templatePath = path.resolve(__dirname, "../../mail/otp.hbs");

  // Read the HTML template file
  const htmlTemplate = fs.readFileSync(templatePath, "utf8");
  const template = hbs.compile(htmlTemplate);
  const compiledHTML = template({
    token: token,
  });

  const mailOptions = {
    from: "trantanminh0603@gmail.com",
    to: email,
    subject: "do not reply",
    html: compiledHTML,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

module.exports = { sendMailToUser, sendMailResetPassword };
