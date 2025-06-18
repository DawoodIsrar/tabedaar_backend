// import mongoose from 'mongoose';
// import jwt from 'jsonwebtoken';

// const { Schema } = mongoose;

// const userSchema = new Schema(
//   {
//     role: {
//       type: String,
//       enum: ["customer", "rider"],
//       required: true,
//     },
//     phone: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     name: {
//       type: String,
//       required: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },
//     password: {
//       type: String,
//       required: true,
//       minlength: 6,
//     },
//     otp: {
//       type: String,
//     },
//     otpExpiresAt: {
//       type: Date,
//     },
//     isVerified: {
//       type: Boolean,
//       default: false,
//     },
//   },
  
//   {
//     timestamps: true,
//   }
// );

// userSchema.methods.createAccessToken = function () {
//   return jwt.sign(
//     {
//       id: this._id,
//       phone: this.phone,
//     },
//     process.env.ACCESS_TOKEN_SECRET,
//     { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
//   );
// };

// userSchema.methods.createRefreshToken = function () {
//   return jwt.sign(
//     { id: this._id, phone: this.phone },
//     process.env.REFRESH_TOKEN_SECRET,
//     {
//       expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
//     }
//   );
// };

// const User = mongoose.model("User", userSchema);
// export default User;


import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["customer", "rider"],
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
  },
  otpExpiresAt: {
    type: Date,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// 🔐 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ✅ Define comparePassword method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ✅ Token generators
userSchema.methods.createAccessToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.ACCESS_TOKEN_SECRET
  );
};

userSchema.methods.createRefreshToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
  );
};

const User = mongoose.model("User", userSchema);
export default User;
