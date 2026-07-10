const express = require("express");
const {
  listPlans,
  createPlan,
  updatePlan,
  subscribe,
  mySubscription,
  allSubscriptions,
} = require("../modules/subscriptions/subscriptions.controller");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.get("/plans", listPlans);
router.post("/plans", verifyToken, createPlan);
router.patch("/plans/:id", verifyToken, updatePlan);
router.post("/subscribe", verifyToken, subscribe);
router.get("/my", verifyToken, mySubscription);
router.get("/all", verifyToken, allSubscriptions);

module.exports = router;
