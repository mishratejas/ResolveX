import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { ApiError } from "./ApiError.js";

dotenv.config();

// Create transporter for Brevo (or any standard SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for port 465, false for port 587
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
 * Sends an email using SMTP.
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
        // 🚀 We use EMAIL_FROM if it exists, otherwise fallback to EMAIL_USER
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER 
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
    
    if (error.code === 'EAUTH') {
      throw new ApiError(500, `Email authentication failed. Please check EMAIL_USER and EMAIL_PASS. Error: ${error.message}`);
    } else if (error.code === 'ESOCKET') {
      throw new ApiError(500, `Network error while sending email. Error: ${error.message}`);
    } else {
      throw new ApiError(500, `Failed to send email to ${to}: ${error.message}`);
    }
  }
};