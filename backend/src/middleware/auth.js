// Middleware: JWT verification and role-based access control
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

// Verifies the JWT access token from the Authorization header
// Attaches decoded user payload to req.user on success
exports.verifyToken = async (req, res, next) => {
  try {
    // Extract token from "Bearer <token>" format
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token is required" });
    }

    const token = authHeader.split(" ")[1];

    // Verify and decode the access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Confirm the user still exists in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isApproved: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // Attach user context to the request for downstream handlers
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token has expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid access token" });
    }
    next(error);
  }
};

// Restricts access to specific roles: authorize("ADMIN", "THERAPIST")
// Must be used after verifyToken so req.user is populated
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
};
