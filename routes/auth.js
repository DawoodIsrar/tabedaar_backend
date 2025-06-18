import express from 'express';
import { refreshToken, auth, verifyOtp, signIn } from '../controllers/auth.js';

const router = express.Router();

router.post('/', auth);
router.post("/verify-otp", verifyOtp);    // Verify OTP and login
router.post('/refresh-token', refreshToken);
router.post('/signin', signIn);


export default router;


