// Therapist profile routes — public directory and individual profiles
// These endpoints intentionally do NOT require authentication so that parents
// and unauthenticated visitors can browse therapist information. Only approved,
// non-deleted therapists are returned.
const express = require("express");
const { getTherapistProfile, listTherapists } = require("../modules/therapists/therapist.controller");

const router = express.Router();

// GET /api/v1/therapists — list all approved therapists
router.get("/", listTherapists);

// GET /api/v1/therapists/:id — single therapist public profile
router.get("/:id", getTherapistProfile);

module.exports = router;
