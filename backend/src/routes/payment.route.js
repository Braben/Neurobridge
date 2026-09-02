const express = require("express");
const {
  initializePayment,
  getSessionFee,
  verifyPayment,
  handleWebhook,
  listTransactions,
  revenueDashboard,
} = require("../modules/payments/payments.controller");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.post("/webhook", handleWebhook);
router.get("/session-fee", verifyToken, getSessionFee);
router.post("/initialize", verifyToken, initializePayment);
router.get("/verify/:reference", verifyToken, verifyPayment);
router.get("/transactions", verifyToken, listTransactions);
router.get("/revenue", verifyToken, revenueDashboard);

module.exports = router;
