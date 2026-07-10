const express = require("express");
const { listBookings, getBooking, createBooking, updateBookingStatus } = require("../modules/bookings/booking.controller");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.use(verifyToken);

router.get("/", listBookings);
router.get("/:id", getBooking);
router.post("/", createBooking);
router.patch("/:id/status", updateBookingStatus);

module.exports = router;
