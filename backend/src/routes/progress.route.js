// Progress routes — aggregated child progress data for charts
// A single GET endpoint that returns all data needed to render the progress
// dashboard. Requires JWT authentication.
const express = require("express");
const { getChildProgress } = require("../modules/progress/progress.controller");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.use(verifyToken);

// GET /api/v1/progress/:childId — full progress snapshot (sessions, goals, behaviours)
router.get("/:childId", getChildProgress);

module.exports = router;
