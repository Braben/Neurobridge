const express = require("express");
const { generateReport } = require("../modules/reports/reports.controller");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.use(verifyToken);

router.get("/:childId", generateReport);

module.exports = router;
