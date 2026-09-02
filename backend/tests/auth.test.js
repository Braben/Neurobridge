// Auth endpoint integration tests
// Run with: npx vitest run
import { describe, it, expect, beforeAll, afterAll } from "vitest";

const API_URL = "http://localhost:5100/api/v1";

// Test user credentials
const testUser = {
  firstName: "Test",
  lastName: "User",
  email: `test-${Date.now()}@example.com`,
  phone: `+23350${Date.now().toString().slice(-8)}`,
  dateOfBirth: "1990-01-01",
  password: "TestPass123!",
  role: "PARENT",
};

let accessToken = "";

describe("Auth Endpoints", () => {
  // ── Registration ──
  it("POST /auth/register — creates a new user", async () => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.message).toContain("Registration successful");
    expect(data.user.email).toBe(testUser.email);
    expect(data.user.role).toBe("PARENT");
    expect(data.accessToken).toBeDefined();
    accessToken = data.accessToken;
  });

  it("POST /auth/register — rejects duplicate email", async () => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const data = await res.json();
    expect(res.status).toBe(409);
    expect(data.message).toContain("already exists");
  });

  it("POST /auth/register — rejects invalid input", async () => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "", email: "bad", password: "12", role: "INVALID" }),
    });
    expect(res.status).toBe(400);
  });

  // ── Login ──
  it("POST /auth/login — authenticates with email", async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.accessToken).toBeDefined();
  });

  it("POST /auth/login — authenticates with phone", async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: testUser.phone, password: testUser.password }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.accessToken).toBeDefined();
  });

  it("POST /auth/login — rejects wrong password", async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUser.email, password: "wrong" }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /auth/login — rejects missing identifier", async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: testUser.password }),
    });
    expect(res.status).toBe(400);
  });

  // ── Token Refresh ──
  it("POST /auth/refresh — requires refresh token cookie", async () => {
    const res = await fetch(`${API_URL}/auth/refresh`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  // ── Profile ──
  it("GET /users/me — returns profile when authenticated", async () => {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.user.email).toBe(testUser.email);
  });

  it("GET /users/me — rejects unauthenticated requests", async () => {
    const res = await fetch(`${API_URL}/users/me`);
    expect(res.status).toBe(401);
  });

  // ── Logout ──
  it("POST /auth/logout — logs out successfully", async () => {
    const res = await fetch(`${API_URL}/auth/logout`, { method: "POST" });
    expect(res.status).toBe(200);
  });
});
