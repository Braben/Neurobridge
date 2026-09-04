// Auth controller - registration, login, logout, token refresh, and OTP flows.
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../../config/prisma");
const { clearRefreshTokenCookieOptions, refreshTokenCookieOptions } = require("../../config/cookies");
const { generateAccessToken, generateRefreshToken } = require("../../utils/generateTokens");
const { sendOtpEmail, sendPasswordResetEmail } = require("../../services/email.service");
const { normalizePhone, sendOtpSms, sendPasswordResetSms } = require("../../services/sms.service");

const OTP_TTL_MS = 10 * 60 * 1000;

const generateOtpCode = () => crypto.randomInt(100000, 999999).toString();

const normalizeEmail = (email) => {
  const value = email?.trim().toLowerCase();
  return value || null;
};

const splitIdentifier = ({ identifier, email, phone }) => {
  const rawIdentifier = identifier?.trim();
  const normalizedEmail = normalizeEmail(email) || (rawIdentifier?.includes("@") ? normalizeEmail(rawIdentifier) : null);
  const normalizedPhone = normalizePhone(phone || (rawIdentifier && !rawIdentifier.includes("@") ? rawIdentifier : ""));

  return {
    email: normalizedEmail || null,
    phone: normalizedPhone || null,
  };
};

const resolveOtpTarget = ({ identifier, email, phone, channel }) => {
  const split = splitIdentifier({ identifier, email, phone });
  if (channel === "EMAIL" && split.email) {
    return { identifier: split.email, channel: "EMAIL" };
  }
  if (channel === "SMS" && split.phone) {
    return { identifier: split.phone, channel: "SMS" };
  }
  if (split.email) {
    return { identifier: split.email, channel: "EMAIL" };
  }
  if (split.phone) {
    return { identifier: split.phone, channel: "SMS" };
  }
  return null;
};

const otpTargetWhere = ({ identifier, channel }) => ({
  OR: [
    { identifier, channel },
    ...(channel === "EMAIL" ? [{ email: identifier }] : []),
  ],
});

const findUserByTarget = ({ identifier, channel }) => {
  if (channel === "EMAIL") {
    return prisma.user.findUnique({ where: { email: identifier } });
  }
  return prisma.user.findUnique({ where: { phone: identifier } });
};

const sendOtpToTarget = async ({ identifier, channel, code, type }) => {
  if (channel === "EMAIL") {
    return type === "PASSWORD_RESET"
      ? sendPasswordResetEmail(identifier, code)
      : sendOtpEmail(identifier, code);
  }

  return type === "PASSWORD_RESET"
    ? sendPasswordResetSms(identifier, code)
    : sendOtpSms(identifier, code);
};

const createOtp = async ({ identifier, channel, code, type }) => {
  return prisma.otpCode.create({
    data: {
      identifier,
      channel,
      email: channel === "EMAIL" ? identifier : null,
      code,
      type,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
};

const invalidateOtp = async ({ identifier, channel, type }) => {
  return prisma.otpCode.updateMany({
    where: {
      ...otpTargetWhere({ identifier, channel }),
      type,
      isUsed: false,
    },
    data: { isUsed: true },
  });
};

const findValidOtp = async ({ identifier, channel, code, type }) => {
  return prisma.otpCode.findFirst({
    where: {
      ...otpTargetWhere({ identifier, channel }),
      code,
      type,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
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

    if (role === "ADMIN") {
      const inviteCode = process.env.ADMIN_INVITE_CODE;
      if (!inviteCode || adminInviteCode !== inviteCode) {
        return res.status(403).json({ message: "Invalid admin invite code" });
      }
    }

    if (role === "THERAPIST" && !areaofexpertise) {
      return res.status(400).json({ message: "Therapists must provide an area of expertise" });
    }

    const expertise = role === "THERAPIST" ? areaofexpertise : null;
    const parsedDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;

    if (dateOfBirth && Number.isNaN(parsedDateOfBirth.getTime())) {
      return res.status(400).json({ message: "Date of birth must be a valid date" });
    }

    const existingConditions = [];
    if (email) existingConditions.push({ email });
    if (phone) existingConditions.push({ phone });
    const existingUser = await prisma.user.findFirst({
      where: { OR: existingConditions },
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email or phone already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS) || 10);
    const otpTarget = resolveOtpTarget({ email, phone });
    const requiresOtp = Boolean(otpTarget);

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

    if (otpTarget) {
      const otpCode = generateOtpCode();
      await createOtp({ ...otpTarget, code: otpCode, type: "EMAIL_VERIFICATION" });

      sendOtpToTarget({ ...otpTarget, code: otpCode, type: "EMAIL_VERIFICATION" }).catch((err) => {
        console.error(`Failed to send ${otpTarget.channel} OTP:`, err.message);
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    return res.status(201).json({
      message: requiresOtp
        ? "Registration successful. Please verify your account with the OTP sent."
        : "Registration successful.",
      requiresOtp,
      otpChannel: otpTarget?.channel || null,
      otpIdentifier: otpTarget?.identifier || null,
      accessToken,
      user: toUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;
    const whereClause = email ? { email: normalizeEmail(email) } : { phone: normalizePhone(phone) };
    const user = await prisma.user.findUnique({ where: whereClause });

    if (!user || user.deletedAt) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: toUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const requestedTarget = resolveOtpTarget(req.body);
    const genericMessage = "If an account exists, password reset instructions will be sent shortly.";

    if (!requestedTarget) {
      return res.status(400).json({ message: "Email or phone number is required" });
    }

    const user = await findUserByTarget(requestedTarget);
    if (!user || user.deletedAt) {
      return res.status(200).json({ message: genericMessage });
    }

    await invalidateOtp({ ...requestedTarget, type: "PASSWORD_RESET" });

    const code = generateOtpCode();
    await createOtp({ ...requestedTarget, code, type: "PASSWORD_RESET" });

    try {
      await sendOtpToTarget({ ...requestedTarget, code, type: "PASSWORD_RESET" });
    } catch (deliveryError) {
      console.error(`Failed to send ${requestedTarget.channel} password reset code:`, deliveryError.message);
    }

    return res.status(200).json({
      message: genericMessage,
      resetChannel: requestedTarget.channel,
      resetIdentifier: requestedTarget.identifier,
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { code, password } = req.body;
    const resetTarget = resolveOtpTarget(req.body);

    if (!resetTarget) {
      return res.status(400).json({ message: "Email or phone number is required" });
    }

    const otpRecord = await findValidOtp({ ...resetTarget, code, type: "PASSWORD_RESET" });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    const user = await findUserByTarget(resetTarget);
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

exports.logoutUser = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      await prisma.user.updateMany({
        where: { refreshToken },
        data: { refreshToken: null },
      });
    }

    res.clearCookie("refreshToken", clearRefreshTokenCookieOptions);

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

exports.refreshTokenPair = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.refreshToken || user.refreshToken !== refreshToken || user.deletedAt) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.cookie("refreshToken", newRefreshToken, refreshTokenCookieOptions);

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

exports.sendOtp = async (req, res, next) => {
  try {
    const otpTarget = resolveOtpTarget(req.body);
    if (!otpTarget) {
      return res.status(400).json({ message: "Email or phone number is required" });
    }

    const user = await findUserByTarget(otpTarget);
    if (!user || user.deletedAt) {
      return res.status(404).json({ message: "Account not found" });
    }

    await invalidateOtp({ ...otpTarget, type: "EMAIL_VERIFICATION" });

    const code = generateOtpCode();
    await createOtp({ ...otpTarget, code, type: "EMAIL_VERIFICATION" });
    await sendOtpToTarget({ ...otpTarget, code, type: "EMAIL_VERIFICATION" });

    return res.status(200).json({
      message: "OTP sent successfully",
      otpChannel: otpTarget.channel,
      otpIdentifier: otpTarget.identifier,
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { code } = req.body;
    const otpTarget = resolveOtpTarget(req.body);
    if (!otpTarget) {
      return res.status(400).json({ message: "Email or phone number is required" });
    }

    const otpRecord = await findValidOtp({ ...otpTarget, code, type: "EMAIL_VERIFICATION" });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP code" });
    }

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { isUsed: true, usedAt: new Date() },
    });

    const user = await findUserByTarget(otpTarget);
    if (user && (user.role === "PARENT" || user.role === "ADMIN")) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isApproved: true },
      });
    }

    return res.status(200).json({
      message: "OTP verified successfully. Account confirmed.",
      isApproved: user?.role === "PARENT" || user?.role === "ADMIN" ? true : false,
    });
  } catch (error) {
    next(error);
  }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const otpTarget = resolveOtpTarget(req.body);
    if (!otpTarget) {
      return res.status(400).json({ message: "Email or phone number is required" });
    }

    const user = await findUserByTarget(otpTarget);
    if (!user || user.deletedAt) {
      return res.status(404).json({ message: "Account not found" });
    }

    await invalidateOtp({ ...otpTarget, type: "EMAIL_VERIFICATION" });

    const code = generateOtpCode();
    await createOtp({ ...otpTarget, code, type: "EMAIL_VERIFICATION" });
    await sendOtpToTarget({ ...otpTarget, code, type: "EMAIL_VERIFICATION" });

    return res.status(200).json({
      message: "OTP resent successfully",
      otpChannel: otpTarget.channel,
      otpIdentifier: otpTarget.identifier,
    });
  } catch (error) {
    next(error);
  }
};
