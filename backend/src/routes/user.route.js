// User routes — authenticated profile management
const express = require("express");
const { getProfile, updateProfile } = require("../modules/users/user.controller");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// All user routes require authentication
router.use(verifyToken);

// Get the authenticated user's profile
router.get("/me", getProfile);

// Update the authenticated user's profile (firstName, lastName, phone, avatar)
router.patch("/me", updateProfile);

module.exports = router;
