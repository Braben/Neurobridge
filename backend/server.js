const dotenv = require("dotenv");
dotenv.config();

// server.js
const app = require("./app");

// Fallback to port 5000 if no environment variable is provided
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server successfully launched on port ${PORT}`);
});

// Handle unhandled promise rejections cleanly
process.on("unhandledRejection", (err) => {
  console.error(`Shutting down due to Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
