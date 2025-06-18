import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import User from "../models/User.js";
import { sendOtpEmail } from "../utils/email.js";
import { BadRequestError, UnauthenticatedError } from "../errors/index.js";

// REGISTER & SEND OTP
export const auth = async (req, res) => {
  const { phone, role, name, email, password } = req.body;

  if (!phone || !role || !["customer", "rider"].includes(role)) {
    throw new BadRequestError("Phone and valid role are required");
  }

  let user = await User.findOne({ email, phone });

  if (user) {
    if (user.isVerified) {
      throw new BadRequestError("User already registered and verified. Please log in.");
    }

    if (!user.name && name) user.name = name;
    if (!user.email && email) user.email = email;
    if (!user.password && password) user.password = password;

    if (!user.name || !user.email || !user.password) {
      throw new BadRequestError("Name, Email, and Password are required for registration");
    }
  } else {
    if (!name || !email || !password) {
      throw new BadRequestError("Name, Email, and Password are required for registration");
    }

    user = new User({ phone, role, name, email, password });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await user.save();
  await sendOtpEmail(email, otp);

  return res.status(StatusCodes.OK).json({
    message: "OTP sent to email for verification",
  });
};

// VERIFY OTP
export const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    throw new BadRequestError("Phone and OTP are required");
  }

  const user = await User.findOne({ phone });

  if (!user || !user.otp || user.otp !== otp || new Date() > user.otpExpiresAt) {
    throw new BadRequestError("Invalid or expired OTP");
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  return res.status(StatusCodes.OK).json({
    message: "OTP verified successfully",
  });
};

// SIGN IN (after verified)
export const signIn = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password ) {
    throw new BadRequestError("Phone, password, and valid role are required");
  }

  const user = await User.findOne({ email });

  if (!user || !user.isVerified) {
    throw new UnauthenticatedError("User not found or not verified");
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new UnauthenticatedError("Incorrect password");
  }

  const accessToken = user.createAccessToken();
  const refreshToken = user.createRefreshToken();

  return res.status(StatusCodes.OK).json({
    message: "Login successful",
    user,
    access_token: accessToken,
    refresh_token: refreshToken,
  });
};


// REFRESH TOKENS
export const refreshToken = async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    throw new BadRequestError("Refresh token is required");
  }

  try {
    const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(payload.id);

    if (!user) {
      throw new UnauthenticatedError("Invalid refresh token");
    }

    const newAccessToken = user.createAccessToken();
    const newRefreshToken = user.createRefreshToken();

    return res.status(StatusCodes.OK).json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  } catch (error) {
    console.error(error);
    throw new UnauthenticatedError("Invalid refresh token");
  }
};
