// Socket.io client — singleton connection manager for real-time events.
// The frontend maintains a single socket connection throughout the user's
// session. connectSocket / disconnectSocket are called by the SocketManager
// component (and the legacy useSocket hook) in response to auth state changes.
// Individual pages that need custom event listeners import getSocket() and
// attach their own .on() handlers.
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

let socket: Socket | null = null;

/**
 * Opens (or returns existing) socket connection authenticated with the JWT.
 * The token is sent in the handshake auth object so the server's middleware
 * can validate it before accepting the connection.
 */
export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  // If the token expires mid-session, disconnect so the UI shows stale state
  // rather than silent failures. The SocketManager will reconnect after refresh.
  socket.on("connect_error", (err) => {
    if (err.message === "Token expired") {
      socket?.disconnect();
    }
  });

  return socket;
};

/** Tears down the socket — removes all listeners and nulls out the reference. */
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

/** Returns the current socket instance (may be disconnected or null). */
export const getSocket = (): Socket | null => socket;
