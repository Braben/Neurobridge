const express = require("express");
const {
  initializePayment,
  verifyPayment,
  handleWebhook,
  listTransactions,
} = require("../modules/payments/payments.controller");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.post("/webhook", handleWebhook);
router.post("/initialize", verifyToken, initializePayment);
router.get("/verify/:reference", verifyToken, verifyPayment);
router.get("/transactions", verifyToken, listTransactions);

module.exports = router;
