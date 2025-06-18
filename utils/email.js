import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })

// Optional: Verify transporter is working
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter setup failed:", error);
  } else {
    console.log("✅ Email transporter is ready");
  }
});

export const sendOtpEmail = async (email, otp) => {
    const mailOptions = {
      from: `"RideApp OTP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your email - Ride Booking App",
      text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>RideApp Email Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="color: #007BFF;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent to ${email}`);
    } catch (err) {
      console.error("❌ Failed to send OTP email:", err);
      throw new Error("Failed to send OTP email");
    }
  };