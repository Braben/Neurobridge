// Socket.io server — real-time event bus for the entire application.
// Every authenticated user joins a private room `user:<id>` so controllers can
// push targeted events (messages, notifications, session updates) to specific
// users without the frontend polling.
const { Server } = require("socket.io");
const { authenticateSocket } = require("./auth");
const { allowedOrigins } = require("../config/cors");

const socketState = globalThis.__neurobridgeSocketState || { io: null };
globalThis.__neurobridgeSocketState = socketState;

/**
 * Attaches a Socket.io server to the raw HTTP server.
 * Call once during server startup (see server.js).
 * @param {import("http").Server} server
 * @returns {import("socket.io").Server}
 */
const initSocket = (server) => {
  if (socketState.io) return socketState.io;

  socketState.io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Every connection runs through JWT auth before being accepted
  socketState.io.use(authenticateSocket);

  socketState.io.on("connection", (socket) => {
    const user = socket.user;

    // Join a private room named after the user's ID so emitToUser works
    socket.join(`user:${user.id}`);
    console.log(`[socket] ${user.email} (${user.role}) connected`);

    socket.on("disconnect", (reason) => {
      console.log(`[socket] ${user.email} disconnected: ${reason}`);
    });
  });

  console.log("[socket] Socket.io initialized");
  return socketState.io;
};

/**
 * Returns the singleton Socket.io server instance.
 * Throws if initSocket hasn't been called yet.
 */
const getIO = () => {
  if (!socketState.io) throw new Error("Socket.io not initialized");
  return socketState.io;
};

const closeSocket = async () => {
  if (!socketState.io) return;

  await new Promise((resolve) => socketState.io.close(() => resolve()));
  socketState.io = null;
};

/**
 * Emits an event to a single user's private room.
 * Used by controllers and services to push real-time updates.
 * @param {string} userId
 * @param {string} event
 * @param {*} data
 */
const emitToUser = (userId, event, data) => {
  if (!socketState.io) return;
  socketState.io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emits an event to multiple users at once.
 * @param {string[]} userIds
 * @param {string} event
 * @param {*} data
 */
const emitToUsers = (userIds, event, data) => {
  if (!socketState.io) return;
  const rooms = userIds.map((id) => `user:${id}`);
  socketState.io.to(rooms).emit(event, data);
};

module.exports = { initSocket, getIO, closeSocket, emitToUser, emitToUsers };
