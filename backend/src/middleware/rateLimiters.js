const rateLimit = require("express-rate-limit");

const isProduction = process.env.NODE_ENV === "production";

exports.contactLimiter = rateLimit({ // Bound anonymous inquiry writes, including successful submissions.
  windowMs: 15 * 60 * 1000, // Reset each IP's allowance every fifteen minutes.
  max: 5, // Limit durable anonymous writes without relying on authentication.
  standardHeaders: true, // Expose retry information to the form.
  legacyHeaders: false, // Use modern rate-limit headers only.
  message: { message: "Too many inquiries, please try again later" }, // Return the shared API error shape.
}); // Finish the contact limiter.

exports.recoveryLimiter = rateLimit({ // Count successful delivery requests as well as failed code attempts.
  windowMs: 15 * 60 * 1000, // Keep short-lived codes within one bounded attempt window.
  max: 20, // Bound both delivery abuse and six-digit code guessing per IP.
  standardHeaders: true, // Let clients honor Retry-After on rejected requests.
  legacyHeaders: false, // Avoid duplicate legacy headers.
  message: { message: "Too many verification requests, please try again later" }, // Keep errors consumable by auth forms.
}); // Finish the recovery limiter.

exports.globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later" },
  skip: (req) => req.path.startsWith("/api/v1/auth"),
});

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Too many authentication attempts, please try again later" },
});

exports.writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many write requests, please slow down and try again" },
});
