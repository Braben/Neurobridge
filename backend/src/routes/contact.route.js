const express = require("express"); // Reuse Express routing.
const { contactLimiter } = require("../middleware/rateLimiters"); // Bound unauthenticated writes.
const { validate } = require("../validators/auth.validator"); // Reuse the existing body-validation middleware.
const { contactSchema } = require("../validators/contact.validator"); // Define the public input contract.
const { createInquiry } = require("../modules/contact/contact.controller"); // Persist validated messages.
const router = express.Router(); // Create the mounted contact router.
router.post("/", contactLimiter, validate(contactSchema), createInquiry); // Validate and rate-limit every contact submission.
module.exports = router; // Mount this router at /api/v1/contact.
