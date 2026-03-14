//backend\utils\sendOTP.js
const nodemailer = require('nodemailer');

const sendOTP = async (email, otp) => {
  console.log('Attempting to send OTP to:', email);
  
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email configuration is missing');
      throw new Error('Email configuration is missing');
    }

    console.log('Creating email transporter with configuration...');
    console.log('Email User:', process.env.EMAIL_USER);
    
    // Create transporter with detailed configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      debug: true,
      logger: true
    });

    // Verify transporter configuration
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    // Email content
    const mailOptions = {
      from: `"ELance Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Verification Code - ELance Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0078d4; text-align: center;">ELance Portal</h2>
          <div style="background-color: #f8f9fa; border-radius: 5px; padding: 20px; margin: 20px 0;">
            <p>Hello,</p>
            <p>Your verification code is:</p>
            <div style="background-color: #ffffff; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px; border: 2px dashed #0078d4;">
              <h1 style="color: #0078d4; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="font-size: 14px; color: #666;">This code will expire in 5 minutes.</p>
            <p style="font-size: 14px; color: #666;">If you didn't request this code, please ignore this email.</p>
          </div>
          <p style="text-align: center; color: #666; font-size: 12px;">
            This is an automated message, please do not reply.
            <br>© ${new Date().getFullYear()} ELance Portal. All rights reserved.
          </p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log('OTP sent successfully to', email);
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP');
  }
};

module.exports = sendOTP;