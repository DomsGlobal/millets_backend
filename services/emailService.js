const nodemailer = require('nodemailer');
require('dotenv').config();   

const sendEmail = async (emailData) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,   
        pass: process.env.SMTP_PASS,   
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.body,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error in sendEmail:', error.message);
    throw error;
  }
};

module.exports = sendEmail;
