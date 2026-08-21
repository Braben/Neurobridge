const express = require("express");
const { listBookings, getBooking, createBooking, updateBookingStatus } = require("../modules/bookings/booking.controller");
const { verifyToken } = require("../middleware/auth");
const { writeLimiter } = require("../middleware/rateLimiters");
const { validate, bookingIdParamSchema, createBookingSchema, updateBookingStatusSchema } = require("../validators/booking.validator");

const router = express.Router();

router.use(verifyToken);

router.get("/", listBookings);
router.get("/:id", validate(bookingIdParamSchema), getBooking);
router.post("/", writeLimiter, validate(createBookingSchema), createBooking);
router.patch("/:id/status", writeLimiter, validate(updateBookingStatusSchema), updateBookingStatus);

module.exports = router;
