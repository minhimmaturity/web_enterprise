const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const dotenv = require("dotenv");
const path = require("path");
const hbs = require("hbs");

dotenv.config();

// Resolve the path to the template file
const templatePath = path.resolve(__dirname, "../../mail/template.hbs");

// Read the HTML template file
const htmlTemplate = fs.readFileSync(templatePath, "utf8");
const template = hbs.compile(htmlTemplate);

const applicationPass = process.env.applicationPasss;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "trantanminh0603@gmail.com",
    pass: "fqubckfknczveman",
  },
});

const sendMailToUser = async (email, password, name) => {
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

module.exports = sendMailToUser;
