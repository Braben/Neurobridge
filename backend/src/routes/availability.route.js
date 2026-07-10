const express = require("express");
const { listSlots, getSlot, createSlot, updateSlot, deleteSlot } = require("../modules/availability/availability.controller");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.use(verifyToken);

router.get("/", listSlots);
router.get("/:id", getSlot);
router.post("/", createSlot);
router.put("/:id", updateSlot);
router.delete("/:id", deleteSlot);

module.exports = router;
