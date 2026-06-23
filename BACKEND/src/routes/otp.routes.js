import express from "express";
import {
    requestOTP,
    verifyOTP,
    userSignupWithOTP,
    staffSignupWithOTP,
    adminSignupWithOTP,
    requestPasswordResetOTP,
    resetPasswordWithOTP,
    resendOTP
} from "../controllers/otp.controllers.js";

const router = express.Router();

// Request OTP (for signup)
// api/otp/request
router.post("/request", requestOTP);

// Verify OTP
router.post("/verify", verifyOTP);

// Resend OTP
router.post("/resend", resendOTP);

// User Signup with OTP
router.post("/signup/user", userSignupWithOTP);

// Staff Signup with OTP
router.post("/signup/staff", staffSignupWithOTP);

// Admin Signup with OTP
router.post("/signup/admin", adminSignupWithOTP);

// Password Reset - Request OTP
router.post("/password-reset/request", requestPasswordResetOTP);

// Password Reset - Verify and Reset
router.post("/password-reset/verify", resetPasswordWithOTP);

export default router;