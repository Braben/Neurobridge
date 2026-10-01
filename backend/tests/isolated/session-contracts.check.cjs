const { test, beforeEach } = require("node:test"); // Keep this isolated suite outside the live Vitest setup.
const assert = require("node:assert/strict"); // Use built-in assertions without extra packages.
const prisma = {}; // Replace persistence before the production controller is loaded.
function fakeModule(path, exports) { const id = require.resolve(path); require.cache[id] = { id, filename: id, loaded: true, exports }; } // Prevent external services from initializing during import.
fakeModule("../../src/config/prisma", prisma); // Do not read database environment or create a Prisma adapter.
fakeModule("../../src/sockets", { emitToUser() {} }); // Never open a websocket server from a contract test.
fakeModule("../../src/services/notification.service", { notifyChildParents: async () => {} }); // Do not deliver real notifications.
const controller = require("../../src/modules/sessions/session.controller"); // Exercise the actual production handler after isolating dependencies.
let calls; // Record the exact authorization and selection arguments sent to persistence.
beforeEach(() => { calls = []; prisma.session = { findMany: async (query) => { calls.push(query); return []; }, findFirst: async (query) => { calls.push(query); return null; } }; }); // Reset storage behavior for each independently executed case.
async function invoke(handler, role, extra = {}) { // Capture Express responses without creating a live application.
  const res = { statusCode: 200, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } }; // Preserve fluent response semantics.
  await handler({ user: { id: "current-user", role }, query: {}, params: {}, ...extra }, res, (error) => { res.error = error; }); // Collect middleware errors for explicit assertions.
  return res; // Return the complete isolated result.
} // End the controller invocation helper.
for (const role of ["THERAPIST", "PARENT", "ADMIN"]) { // Verify each existing authorization branch is preserved.
  test(`${role} session list retains ownership and optional child scope`, async () => { // Prevent the richer projection from broadening record access.
    const result = await invoke(controller.listSessions, role, { query: { childId: "selected-child", therapistId: "another-user" } }); // Try an unrelated therapist query that must not override the signed-in principal.
    const expected = { childId: "selected-child" }; // Retain the explicit child filter for all roles.
    if (role === "THERAPIST") expected.therapistId = "current-user"; // Limit therapists to sessions they own.
    if (role === "PARENT") expected.child = { parents: { some: { parentId: "current-user" } } }; // Limit parents to their linked children.
    assert.deepEqual(calls[0].where, expected); assert.deepEqual(calls[0].orderBy, { sessionDate: "desc" }); // Assert ownership and recent-first ordering together.
    assert.equal(result.error, undefined); assert.equal(result.statusCode, 200); assert.deepEqual(result.body, { sessions: [] }); // Preserve the service response contract.
  }); // End role-specific list authorization coverage.
  test(`${role} session detail retains ownership and hides missing records`, async () => { // Apply the same protection when a session ID is known.
    const result = await invoke(controller.getSession, role, { params: { id: "foreign-session" } }); // Simulate a record outside the caller's scope.
    const expected = { id: "foreign-session" }; // Select the requested ID without trusting its ownership.
    if (role === "THERAPIST") expected.therapistId = "current-user"; // Require the current therapist to own the session.
    if (role === "PARENT") expected.child = { parents: { some: { parentId: "current-user" } } }; // Require an authorized caregiver relationship.
    assert.deepEqual(calls[0].where, expected); assert.equal(result.error, undefined); assert.equal(result.statusCode, 404); // Return no foreign clinical details when the scoped lookup misses.
    assert.deepEqual(result.body, { message: "Session not found" }); // Keep the rejection independent of whether the ID exists elsewhere.
  }); // End role-specific detail authorization coverage.
} // End the existing role matrix.
test("cross-child therapist list uses one bounded relation projection without account secrets", async () => { // Verify the frontend's new fields without an N+1 child lookup.
  await invoke(controller.listSessions, "THERAPIST"); // Omit childId to exercise the new full-table workflow.
  assert.equal(calls.length, 1); assert.deepEqual(calls[0].where, { therapistId: "current-user" }); // Query only this therapist's sessions once.
  assert.deepEqual(calls[0].select.child, { select: { id: true, firstName: true, lastName: true, dateOfBirth: true, profileImage: true, parents: { select: { parent: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { parentId: "asc" } } } }); // Explicitly exclude parent passwords, tokens, contact information, and unrelated child medical fields.
  assert.deepEqual(calls[0].select.therapist, { select: { id: true, firstName: true, lastName: true, avatar: true, areaofexpertise: true } }); // Preserve the already-safe therapist projection.
}); // End projection coverage.
test("session storage failure reaches error middleware instead of reporting an empty list", async () => { // Preserve truthful UI error states.
  const failure = new Error("isolated storage failure"); prisma.session.findMany = async () => { throw failure; }; // Fail persistence without touching any real database.
  const result = await invoke(controller.listSessions, "THERAPIST"); // Exercise the actual handler's error branch.
  assert.equal(result.error, failure); assert.equal(result.body, undefined); // Require middleware to own the failure response.
}); // End failure coverage.
