// app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

const app = express();

// --- Middleware Stack ---
app.use(
  cors({
    origin: true, // Configures CORS; adjust for production security
    credentials: true,
  }),
);
app.use(morgan("dev")); // Standard HTTP request logging
app.use(express.json()); // Parses incoming JSON payloads
app.use(cookieParser()); // Parses cookies into req.cookies

// --- Sample Routes ---
app.get("/api/v1/", (req, res) => {
  res.json({ status: "success", message: "API server is running smoothly." });
});

// --- 404 Catch-All ---
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
