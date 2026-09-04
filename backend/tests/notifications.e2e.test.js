// End-to-end tests for notification API + real-time socket events
// The Vitest setup file starts the API on TEST_PORT before these tests run.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { io as ioc } from "socket.io-client";

const TEST_PORT = process.env.TEST_PORT || 5100;
const API_URL = process.env.TEST_API_URL || `http://localhost:${TEST_PORT}/api/v1`;
const WS_URL = process.env.TEST_WS_URL || `http://localhost:${TEST_PORT}`;

// Unique timestamps to avoid collisions
const ts = Date.now();
const isoDate = new Date().toISOString();

// ── Test data ────────────────────────────────────
const parentUser = {
  firstName: "NotifyParent",
  lastName: "E2E",
  email: `notify-parent-${ts}@example.com`,
  phone: `+23351${ts.toString().slice(-8)}`,
  dateOfBirth: "1990-01-01",
  password: "TestPass123!",
  role: "PARENT",
};

const therapistUser = {
  firstName: "NotifyTherapist",
  lastName: "E2E",
  email: `notify-therapist-${ts}@example.com`,
  phone: `+23352${ts.toString().slice(-8)}`,
  dateOfBirth: "1990-01-01",
  password: "TestPass123!",
  role: "THERAPIST",
  areaofexpertise: "Speech Therapy",
};

let parentToken = "";
let therapistToken = "";
let childId = "";
let sessionId = "";

// Helper: authenticated fetch
const authFetch = (url, token, options = {}) =>
  fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const waitForSocketEvent = (socket, event, timeoutMs = 10000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handleEvent);
      reject(new Error(`Timed out waiting for ${event}`));
    }, timeoutMs);

    const handleEvent = (data) => {
      clearTimeout(timer);
      resolve(data);
    };

    socket.once(event, handleEvent);
  });

describe("Notifications E2E — API & Real-Time", () => {
  // ── Setup: register users, create child, assign, log session ──
  beforeAll(async () => {
    // Register parent
    const parentRes = await authFetch(`${API_URL}/auth/register`, "", {
      method: "POST",
      body: JSON.stringify(parentUser),
    });
    const parentData = await parentRes.json();
    expect(parentRes.status).toBe(201);
    parentToken = parentData.accessToken;

    // Register therapist
    const therapistRes = await authFetch(`${API_URL}/auth/register`, "", {
      method: "POST",
      body: JSON.stringify(therapistUser),
    });
    const therapistData = await therapistRes.json();
    expect(therapistRes.status).toBe(201);
    therapistToken = therapistData.accessToken;

    // Admin approves the therapist (parent can't assign therapists)
    // Login as admin
    const adminRes = await authFetch(`${API_URL}/auth/login`, "", {
      method: "POST",
      body: JSON.stringify({ email: "admin@neurobridge.com", password: "Admin@123" }),
    });
    const adminData = await adminRes.json();
    expect(adminRes.status).toBe(200);
    const adminToken = adminData.accessToken;

    // Approve therapist
    await authFetch(`${API_URL}/admin/users/${therapistData.user.id}/approve`, adminToken, {
      method: "PATCH",
      body: JSON.stringify({ isApproved: true }),
    });

    // Create child as parent
    const childRes = await authFetch(`${API_URL}/children`, parentToken, {
      method: "POST",
      body: JSON.stringify({
        firstName: "TestChild",
        lastName: "E2E",
        dateOfBirth: new Date("2020-06-15").toISOString(),
        gender: "MALE",
      }),
    });
    const childData = await childRes.json();
    expect(childRes.status).toBe(201);
    childId = childData.child.id;

    // Admin assigns therapist to child
    const assignRes = await authFetch(`${API_URL}/children/${childId}/assign`, adminToken, {
      method: "POST",
      body: JSON.stringify({ therapistId: therapistData.user.id }),
    });
    expect(assignRes.status).toBe(200);
  });

  afterAll(async () => {
    // Cleanup: delete test child (cascades to assignments, notifications)
    const adminRes = await authFetch(`${API_URL}/auth/login`, "", {
      method: "POST",
      body: JSON.stringify({ email: "admin@neurobridge.com", password: "Admin@123" }),
    });
    const adminData = await adminRes.json();
    await authFetch(`${API_URL}/children/${childId}`, adminData.accessToken, { method: "DELETE" });
  });

  // ──────────────────────────────────────────────
  // TEST: Therapist assignment creates notifications
  // ──────────────────────────────────────────────
  it("creates notifications on therapist assignment", async () => {
    // Wait briefly for async notification creation
    await wait(500);

    // Check parent's notifications
    const parentNotifs = await authFetch(`${API_URL}/notifications`, parentToken);
    const parentData = await parentNotifs.json();
    expect(parentNotifs.status).toBe(200);
    expect(parentData.notifications.length).toBeGreaterThanOrEqual(1);
    expect(parentData.notifications.some((n) => n.title === "Therapist Assigned")).toBe(true);

    // Check therapist's notifications
    const therNotifs = await authFetch(`${API_URL}/notifications`, therapistToken);
    const therData = await therNotifs.json();
    expect(therNotifs.status).toBe(200);
    expect(therData.notifications.some((n) => n.title === "New Child Assignment")).toBe(true);
  });

  // ──────────────────────────────────────────────
  // TEST: POST /api/v1/sessions triggers notification to parents
  // ──────────────────────────────────────────────
  it("creates notifications when a session is logged", async () => {
    // Therapist creates a session
    const sessionRes = await authFetch(`${API_URL}/sessions`, therapistToken, {
      method: "POST",
      body: JSON.stringify({
        childId,
        sessionDate: new Date().toISOString(),
        duration: 45,
      }),
    });
    const sessionData = await sessionRes.json();
    expect(sessionRes.status).toBe(201);
    sessionId = sessionData.session.id;

    // Wait for notification emission
    await wait(500);

    // Parent should have received a "New Session Logged" notification
    const parentNotifs = await authFetch(`${API_URL}/notifications`, parentToken);
    const parentData = await parentNotifs.json();
    expect(parentData.notifications.some((n) => n.title === "New Session Logged")).toBe(true);
  });

  // ──────────────────────────────────────────────
  // TEST: GET /api/v1/notifications/unread-count
  // ──────────────────────────────────────────────
  it("GET /notifications/unread-count returns correct count", async () => {
    const res = await authFetch(`${API_URL}/notifications/unread-count`, parentToken);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(typeof data.unreadCount).toBe("number");
    expect(data.unreadCount).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────
  // TEST: PATCH /api/v1/notifications/:id/read
  // ──────────────────────────────────────────────
  it("PATCH /notifications/:id/read marks one notification as read", async () => {
    // Get the first unread notification
    const listRes = await authFetch(`${API_URL}/notifications`, parentToken);
    const listData = await listRes.json();
    const unread = listData.notifications.find((n) => !n.isRead);
    expect(unread).toBeDefined();

    // Mark it as read
    const readRes = await authFetch(`${API_URL}/notifications/${unread.id}/read`, parentToken, {
      method: "PATCH",
    });
    expect(readRes.status).toBe(200);

    // Verify it's now read
    const verifyRes = await authFetch(`${API_URL}/notifications`, parentToken);
    const verifyData = await verifyRes.json();
    const found = verifyData.notifications.find((n) => n.id === unread.id);
    expect(found.isRead).toBe(true);
  });

  // ──────────────────────────────────────────────
  // TEST: PATCH /api/v1/notifications/read-all
  // ──────────────────────────────────────────────
  it("PATCH /notifications/read-all marks all as read", async () => {
    const res = await authFetch(`${API_URL}/notifications/read-all`, therapistToken, {
      method: "PATCH",
    });
    expect(res.status).toBe(200);

    // Verify
    const verifyRes = await authFetch(`${API_URL}/notifications`, therapistToken);
    const verifyData = await verifyRes.json();
    expect(verifyData.notifications.every((n) => n.isRead)).toBe(true);
  });

  // ──────────────────────────────────────────────
  // TEST: GET /notifications requires auth
  // ──────────────────────────────────────────────
  it("GET /notifications rejects unauthenticated requests", async () => {
    const res = await fetch(`${API_URL}/notifications`);
    expect(res.status).toBe(401);
  });

  // ──────────────────────────────────────────────
  // TEST: Real-time socket event — notification:new
  // ──────────────────────────────────────────────
  it("emits notification:new over socket.io in real-time", async () => {
    // Connect socket as parent
    const socket = ioc(WS_URL, {
      auth: { token: parentToken },
      transports: ["websocket"],
      forceNew: true,
    });

    try {
      // Wait for connection
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Socket connection timeout")), 10000);
        socket.on("connect", () => {
          clearTimeout(timer);
          resolve();
        });
        socket.on("connect_error", reject);
      });

      // Set up a promise to catch the first notification:new event
      const notificationPromise = waitForSocketEvent(socket, "notification:new");

      // Trigger a notification by creating another session
      const sessionRes = await authFetch(`${API_URL}/sessions`, therapistToken, {
        method: "POST",
        body: JSON.stringify({
          childId,
          sessionDate: new Date().toISOString(),
          duration: 30,
        }),
      });
      expect(sessionRes.status).toBe(201);

      // Wait for the socket event
      const eventData = await notificationPromise;
      expect(eventData).toHaveProperty("notification");
      expect(eventData.notification.title).toBe("New Session Logged");
    } finally {
      socket.disconnect();
    }
  }, 15000);

  // ──────────────────────────────────────────────
  // TEST: Real-time socket event — session:created
  // ──────────────────────────────────────────────
  it("emits session:created over socket.io in real-time", async () => {
    const socket = ioc(WS_URL, {
      auth: { token: therapistToken },
      transports: ["websocket"],
      forceNew: true,
    });

    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Socket connection timeout")), 10000);
        socket.on("connect", () => {
          clearTimeout(timer);
          resolve();
        });
        socket.on("connect_error", reject);
      });

      const sessionPromise = waitForSocketEvent(socket, "session:created");

      const sessionRes = await authFetch(`${API_URL}/sessions`, therapistToken, {
        method: "POST",
        body: JSON.stringify({
          childId,
          sessionDate: new Date().toISOString(),
          duration: 30,
        }),
      });
      expect(sessionRes.status).toBe(201);

      const eventData = await sessionPromise;
      expect(eventData).toHaveProperty("session");
      expect(eventData.session.childId).toBe(childId);
    } finally {
      socket.disconnect();
    }
  }, 15000);
});
