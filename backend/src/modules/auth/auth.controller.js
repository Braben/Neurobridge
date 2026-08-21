// Auth controller — handles registration, login, logout, token refresh, and OTP flows
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../../config/prisma");
const { generateAccessToken, generateRefreshToken } = require("../../utils/generateTokens");
const { sendOtpEmail, sendPasswordResetEmail } = require("../../services/email.service");

// Generates a cryptographically secure 6-digit OTP code
const generateOtpCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const splitIdentifier = ({ identifier, email, phone }) => {
  const rawIdentifier = identifier?.trim();
  const normalizedEmail = email?.trim() || (rawIdentifier?.includes("@") ? rawIdentifier : null);
  const normalizedPhone = phone?.trim() || (rawIdentifier && !rawIdentifier.includes("@") ? rawIdentifier : null);

  return {
    email: normalizedEmail || null,
    phone: normalizedPhone || null,
  };
};

const toUserResponse = (user) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  dateOfBirth: user.dateOfBirth,
  areaofexpertise: user.areaofexpertise,
  role: user.role,
  avatar: user.avatar,
  isApproved: user.isApproved,
  createdAt: user.createdAt,
});

// ──────────────────────────────────────────────
// Registration
// ──────────────────────────────────────────────

exports.registerUser = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      identifier,
      email: submittedEmail,
      phone: submittedPhone,
      dateOfBirth,
      password,
      role,
      avatar,
      adminInviteCode,
      areaofexpertise,
    } = req.body;
    const { email, phone } = splitIdentifier({ identifier, email: submittedEmail, phone: submittedPhone });

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone number is required" });
    }

    // Admin registration requires a deployment-configured invite code
    if (role === "ADMIN") {
      const inviteCode = process.env.ADMIN_INVITE_CODE;
      if (!inviteCode || adminInviteCode !== inviteCode) {
        return res.status(403).json({ message: "Invalid admin invite code" });
      }
    }

    // Therapists must specify their area of expertise
    if (role === "THERAPIST" && !areaofexpertise) {
      return res.status(400).json({ message: "Therapists must provide an area of expertise" });
    }

    const expertise = role === "THERAPIST" ? areaofexpertise : null;
    const parsedDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;

    if (dateOfBirth && Number.isNaN(parsedDateOfBirth.getTime())) {
      return res.status(400).json({ message: "Date of birth must be a valid date" });
    }

    // Check whether the email or phone is already taken
    const existingConditions = [];
    if (email) existingConditions.push({ email });
    if (phone) existingConditions.push({ phone });
    const existingUser = await prisma.user.findFirst({
      where: { OR: existingConditions },
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email or phone already exists" });
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS) || 10);

    // Create the user record (not yet approved — OTP verification is required)
    // Therapists additionally require admin approval after OTP verification
    const requiresOtp = Boolean(email);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: parsedDateOfBirth,
        password: hashedPassword,
        areaofexpertise: expertise,
        role,
        avatar: avatar || null,
        isApproved: !requiresOtp && role === "PARENT",
      },
    });

    if (requiresOtp) {
      // Generate an OTP code for email verification
      const otpCode = generateOtpCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.otpCode.create({
        data: {
          email,
          code: otpCode,
          type: "EMAIL_VERIFICATION",
          expiresAt,
        },
      });

      // Send the OTP email (non-blocking — fire and forget)
      sendOtpEmail(email, otpCode).catch((err) => {
        console.error("Failed to send OTP email:", err.message);
      });
    }

    // Generate authentication tokens (temporary — user must verify OTP)
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: requiresOtp
        ? "Registration successful. Please verify your email with the OTP sent."
        : "Registration successful.",
      requiresOtp,
      accessToken,
      user: toUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// Login — accepts email OR phone as identifier
// ──────────────────────────────────────────────

exports.loginUser = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    // Look up the user by the provided identifier
    const whereClause = email ? { email } : { phone };
    const user = await prisma.user.findUnique({ where: whereClause });

    // Fail if the user does not exist or was soft-deleted
    if (!user || user.deletedAt) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate a new token pair
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Persist the new refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Set the refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        areaofexpertise: user.areaofexpertise,
        role: user.role,
        avatar: user.avatar,
        isApproved: user.isApproved,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// Password Reset — request and consume one-time reset codes
// ──────────────────────────────────────────────

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    const { email, phone } = splitIdentifier({ identifier });
    const genericMessage = "If an account exists, password reset instructions will be sent shortly.";

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone number is required" });
    }

    const user = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (!user?.email) {
      return res.status(200).json({ message: genericMessage });
    }

    await prisma.otpCode.updateMany({
      where: { email: user.email, type: "PASSWORD_RESET", isUsed: false },
      data: { isUsed: true },
    });

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpCode.create({
      data: {
        email: user.email,
        code,
        type: "PASSWORD_RESET",
        expiresAt,
      },
    });

    await sendPasswordResetEmail(user.email, code);

    return res.status(200).json({ message: genericMessage });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, password } = req.body;

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email,
        code,
        type: "PASSWORD_RESET",
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    const hashedPassword = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS) || 10);

    await prisma.$transaction([
      prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { isUsed: true, usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, refreshToken: null },
      }),
    ]);

    return res.status(200).json({ message: "Password reset successfully. You can now sign in." });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// Logout — clears the refresh token from DB and cookie
// ──────────────────────────────────────────────

exports.logoutUser = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Remove the refresh token from the database
      await prisma.user.updateMany({
        where: { refreshToken },
        data: { refreshToken: null },
      });
    }

    // Clear the cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// Token Refresh — issues a new access + refresh token pair
// ──────────────────────────────────────────────

exports.refreshTokenPair = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required" });
    }

    // Verify the refresh token signature
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Confirm the token matches what is stored in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.refreshToken || user.refreshToken !== refreshToken || user.deletedAt) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Generate a new token pair (rotates the refresh token)
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }
    next(error);
  }
};

// ──────────────────────────────────────────────
// Send OTP — generates a code and emails it to the user
// ──────────────────────────────────────────────

exports.sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Invalidate any previous unused OTPs for this email and type
    await prisma.otpCode.updateMany({
      where: { email, type: "EMAIL_VERIFICATION", isUsed: false },
      data: { isUsed: true },
    });

    // Generate a new 6-digit code with a 10-minute expiry
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpCode.create({
      data: {
        email,
        code,
        type: "EMAIL_VERIFICATION",
        expiresAt,
      },
    });

    // Dispatch the email
    await sendOtpEmail(email, code);

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// Verify OTP — validates the code and marks the user as verified
// ──────────────────────────────────────────────

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    // Find the latest unused, non-expired OTP for this email
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email,
        code,
        type: "EMAIL_VERIFICATION",
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP code" });
    }

    // Mark the code as consumed
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { isUsed: true, usedAt: new Date() },
    });

    // Approve the user (email is now verified)
    // Therapists still require separate admin approval
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && (user.role === "PARENT" || user.role === "ADMIN")) {
      await prisma.user.update({
        where: { email },
        data: { isApproved: true },
      });
    }

    return res.status(200).json({
      message: "OTP verified successfully. Email confirmed.",
      isApproved: user?.role === "PARENT" || user?.role === "ADMIN" ? true : false,
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// Resend OTP — invalidates the old code and sends a fresh one
// ──────────────────────────────────────────────

exports.resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Invalidate all previous unused OTPs
    await prisma.otpCode.updateMany({
      where: { email, type: "EMAIL_VERIFICATION", isUsed: false },
      data: { isUsed: true },
    });

    // Generate a fresh code
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpCode.create({
      data: {
        email,
        code,
        type: "EMAIL_VERIFICATION",
        expiresAt,
      },
    });

    await sendOtpEmail(email, code);

    return res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    next(error);
  }
};
