// app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const helmet = require("helmet"); // Security headers
const { authLimiter, globalLimiter } = require("./src/middleware/rateLimiters");
const { sanitizeBody } = require("./src/middleware/sanitize");

const authRoutes = require("./src/routes/auth.route");
const userRoutes = require("./src/routes/user.route");
const childRoutes = require("./src/routes/child.route");
const sessionRoutes = require("./src/routes/session.route");
const intakeRoutes = require("./src/routes/intake.route");
const goalRoutes = require("./src/routes/goal.route");
const behaviourRoutes = require("./src/routes/behaviour.route");
const adminRoutes = require("./src/routes/admin.route");
const messageRoutes = require("./src/routes/message.route");
const notificationRoutes = require("./src/routes/notification.route");
// Phase 2 routes — resource library, file uploads, progress charts, therapist profiles
const resourceRoutes = require("./src/routes/resource.route");
const uploadRoutes = require("./src/routes/upload.route");
const progressRoutes = require("./src/routes/progress.route");
const therapistRoutes = require("./src/routes/therapist.route");
// Phase 3: Booking system
const availabilityRoutes = require("./src/routes/availability.route");
const bookingRoutes = require("./src/routes/booking.route");
// Phase 3: Payments & Subscriptions
const paymentRoutes = require("./src/routes/payment.route");
const subscriptionRoutes = require("./src/routes/subscription.route");
// Phase 3: Reports
const reportRoutes = require("./src/routes/report.route");

const app = express();

// --- Middleware Stack ---
app.use(helmet()); // Sets secure HTTP headers (X-Frame-Options, CSP, etc.)

// Restrict CORS to the frontend origin in production
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(globalLimiter);

app.use(morgan("dev")); // Standard HTTP request logging
app.use(express.json({ limit: "10kb" })); // Parses incoming JSON payloads (10kb limit)
app.use(sanitizeBody);
app.use(cookieParser()); // Parses cookies into req.cookies

// --- Sample Routes ---
app.get("/api/v1/", (req, res) => {
  res.json({ status: "success", message: "API server is running smoothly." });
});

// --- Modular Routes ---
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/children", childRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/intake", intakeRoutes);
app.use("/api/v1/goals", goalRoutes);
app.use("/api/v1/behaviours", behaviourRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/notifications", notificationRoutes);
// Phase 2: Resource library, file uploads, progress dashboard, therapist profiles
app.use("/api/v1/resources", resourceRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/progress", progressRoutes);
app.use("/api/v1/therapists", therapistRoutes);
// Phase 3: Booking system
app.use("/api/v1/availability", availabilityRoutes);
app.use("/api/v1/bookings", bookingRoutes);
// Phase 3: Payments & Subscriptions
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
// Phase 3: Reports
app.use("/api/v1/reports", reportRoutes);

// --- 404 Catch-All ---
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;
