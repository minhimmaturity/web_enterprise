const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'trantanminh0603@gmail.com',
      pass: 'yourpassword'
    }
  });

const sendMailToUser = async(email) => {
    const mailOptions = {
        from: 'trantanminh0603@gmail.com',
        to: email,
        subject: 'Sending Email using Node.js',
        text: 'That was easy!'
      };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}

  
  