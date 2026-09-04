const express = require("express");
const { getIntakeForm, upsertIntakeForm } = require("../modules/intake/intake.controller");
const { verifyToken, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(verifyToken);

router.get("/:childId", getIntakeForm);
router.put("/:childId", authorize("PARENT", "ADMIN"), upsertIntakeForm);

module.exports = router;
