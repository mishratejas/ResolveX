import express from "express";
import {
    requestOTP,
    verifyOTP,
    userSignupWithOTP,
    staffSignupWithOTP,
    userLoginWithOTP,
    staffLoginWithOTP,
    adminLoginWithOTP,
    requestPasswordResetOTP,
    resetPasswordWithOTP,
    resendOTP,
    debugOTP
} from "../controllers/otp.controllers.js";

const router = express.Router();

// Request OTP (for login/signup)
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

// User Login with OTP
router.post("/login/user", userLoginWithOTP);

// Staff Login with OTP
router.post("/login/staff", staffLoginWithOTP);

// Admin Login with OTP
router.post("/login/admin", adminLoginWithOTP);

// Password Reset - Request OTP
router.post("/password-reset/request", requestPasswordResetOTP);

// Password Reset - Verify and Reset
router.post("/password-reset/verify", resetPasswordWithOTP);

// Debug OTP endpoint
router.get("/debug", debugOTP);

export default router;