// app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const helmet = require("helmet"); // Security headers
const rateLimit = require("express-rate-limit"); // Rate limiting

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

// Global rate limiter — 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later" },
});
app.use(globalLimiter);

app.use(morgan("dev")); // Standard HTTP request logging
app.use(express.json({ limit: "10kb" })); // Parses incoming JSON payloads (10kb limit)
app.use(cookieParser()); // Parses cookies into req.cookies

// --- Sample Routes ---
app.get("/api/v1/", (req, res) => {
  res.json({ status: "success", message: "API server is running smoothly." });
});

// --- Modular Routes ---
app.use("/api/v1/auth", authRoutes);
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
