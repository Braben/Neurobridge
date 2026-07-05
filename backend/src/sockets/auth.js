// Socket.io authentication middleware.
// Extracts the JWT from the handshake (auth or query), verifies it, looks up
// the user in the database, and attaches the user object to the socket.
// Connections without a valid token are rejected before any events are processed.
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

/**
 * Socket.io middleware that authenticates every incoming connection.
 * Attaches `socket.user` on success or calls `next(err)` to reject.
 */
const authenticateSocket = async (socket, next) => {
  try {
    // Accept token from either auth handshake (socket.io-client default) or query param
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify the user still exists and is active (not soft-deleted)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isApproved: true, deletedAt: true, firstName: true, lastName: true, email: true },
    });

    if (!user || user.deletedAt) {
      return next(new Error("User not found"));
    }

    socket.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new Error("Token expired"));
    }
    next(new Error("Invalid token"));
  }
};

module.exports = { authenticateSocket };
