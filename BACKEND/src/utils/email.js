import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { ApiError } from "./ApiError.js";

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test the connection
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

/**
 * Sends an email using Gmail SMTP.
 * @param {string} to - recipient email
 * @param {string} subject - subject line
 * @param {string} text - plain text version
 * @param {string} html - HTML version
 */
export const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: {
        name: 'ResolveX',
        address: process.env.EMAIL_USER
      },
      to: to,
      subject: subject,
      text: text,
      html: html
    };

    console.log(`📧 Attempting to send email to: ${to}`);

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
    // More detailed error messages
    if (error.code === 'EAUTH') {
      throw new ApiError(500, `Email authentication failed. Please check EMAIL_USER and EMAIL_PASS in .env file. Error: ${error.message}`);
    } else if (error.code === 'ESOCKET') {
      throw new ApiError(500, `Network error while sending email. Please check internet connection. Error: ${error.message}`);
    } else {
      throw new ApiError(500, `Failed to send email to ${to}: ${error.message}`);
    }
  }
};
