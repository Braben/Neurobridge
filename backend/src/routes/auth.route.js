// Auth routes — registration, login, logout, token refresh, and OTP endpoints
const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  refreshTokenPair,
  sendOtp,
  verifyOtp,
  resendOtp,
  requestPasswordReset,
  resetPassword,
} = require("../modules/auth/auth.controller");
const {
  validate,
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} = require("../validators/auth.validator");

const router = express.Router();
const { recoveryLimiter } = require("../middleware/rateLimiters"); // Count successful deliveries as well as invalid code attempts.

// Registration
router.post("/register", validate(registerSchema), registerUser);

// Login — accepts email OR phone
router.post("/login", validate(loginSchema), loginUser);

router.post("/request-password-reset", recoveryLimiter, validate(requestPasswordResetSchema), requestPasswordReset); // Bound password-reset delivery requests.
router.post("/reset-password", recoveryLimiter, validate(resetPasswordSchema), resetPassword); // Bound reset-code guesses.

// Logout — clears refresh token from DB and cookie
router.post("/logout", logoutUser);

// Token refresh — rotates the refresh token
router.post("/refresh", refreshTokenPair);

// OTP email verification
router.post("/send-otp", recoveryLimiter, validate(sendOtpSchema), sendOtp); // Bound initial verification delivery.
router.post("/verify-otp", recoveryLimiter, validate(verifyOtpSchema), verifyOtp); // Bound verification guesses.
router.post("/resend-otp", recoveryLimiter, validate(sendOtpSchema), resendOtp); // Count successful resends against the shared allowance.

module.exports = router;
