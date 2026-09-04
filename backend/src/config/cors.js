const DEFAULT_FRONTEND_URL = "http://localhost:3000";

const parseAllowedOrigins = () => {
  const configuredOrigins = [process.env.FRONTEND_URL, process.env.CORS_ORIGINS]
    .filter(Boolean)
    .join(",");

  return (configuredOrigins || DEFAULT_FRONTEND_URL)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

module.exports = { allowedOrigins, corsOptions };
