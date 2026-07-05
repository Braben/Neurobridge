// Auth routes — registration, login, logout, token refresh, and OTP endpoints
const express = require("express");
const { registerUser, loginUser, logoutUser, refreshTokenPair, sendOtp, verifyOtp, resendOtp } = require("../modules/auth/auth.controller");
const { validate, registerSchema, loginSchema, sendOtpSchema, verifyOtpSchema } = require("../validators/auth.validator");

const router = express.Router();

// Registration
router.post("/register", validate(registerSchema), registerUser);

// Login — accepts email OR phone
router.post("/login", validate(loginSchema), loginUser);

// Logout — clears refresh token from DB and cookie
router.post("/logout", logoutUser);

// Token refresh — rotates the refresh token
router.post("/refresh", refreshTokenPair);

// OTP email verification
router.post("/send-otp", validate(sendOtpSchema), sendOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/resend-otp", validate(sendOtpSchema), resendOtp);

module.exports = router;
