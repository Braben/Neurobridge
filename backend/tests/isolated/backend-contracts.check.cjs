const { test, beforeEach } = require("node:test"); // Use .check.cjs so Vitest does not discover this isolated Node suite.
const assert = require("node:assert/strict"); // Use built-in assertions without additional dependencies.
const express = require("express"); // Exercise real Express routers against isolated storage.
const jwt = require("jsonwebtoken"); // Sign local test tokens without production secrets.
const prisma = {}; // Replace the database module before importing any controllers.
const delivery = []; // Record delivery attempts without network calls.
const fakeModule = (path, exports) => { // Inject CommonJS dependencies before application modules load.
  const id = require.resolve(path); // Resolve the existing file without evaluating it.
  require.cache[id] = { id, filename: id, loaded: true, exports }; // Prevent Prisma and mail configuration from executing.
}; // End dependency injection helper.
fakeModule("../../src/config/prisma", prisma); // Never initialize a database adapter in this suite.
fakeModule("../../src/services/email.service", { sendOtpEmail: async (...args) => delivery.push(args), sendPasswordResetEmail: async (...args) => delivery.push(args) }); // Stub all auth email delivery.
fakeModule("../../src/services/sms.service", { normalizePhone: (value) => value || null, sendOtpSms: async (...args) => delivery.push(args), sendPasswordResetSms: async (...args) => delivery.push(args) }); // Stub SMS delivery and deterministic normalization.
fakeModule("../../src/services/settings.service", {}); // Prevent unrelated settings dependencies from loading.
fakeModule("bcryptjs", { hash: async () => "test-password-hash" }); // Keep the race test independent of CPU cost.
const auth = require("../../src/modules/auth/auth.controller"); // Load auth only after external dependencies are isolated.
const contact = require("../../src/modules/contact/contact.controller"); // Exercise the production inquiry controller.
const admin = require("../../src/modules/admin/admin.controller"); // Verify safe admin response projection.
const { contactSchema } = require("../../src/validators/contact.validator"); // Test the same schema used by the contact route.
const { verifyOtpSchema, resetPasswordSchema } = require("../../src/validators/auth.validator"); // Test numeric OTP contracts.
const { contactLimiter, recoveryLimiter } = require("../../src/middleware/rateLimiters"); // Exercise the actual limiter configurations.
const contactRouter = require("../../src/routes/contact.route"); // Load the public route with real validation and rate limiting.
const adminRouter = require("../../src/routes/admin.route"); // Load the admin routes with actual role guards.
const authRouter = require("../../src/routes/auth.route"); // Verify recovery limits include successful responses.
const userId = "11111111-1111-4111-8111-111111111111"; // Use a valid deterministic account ID.
const inquiryId = "22222222-2222-4222-8222-222222222222"; // Use a valid deterministic inquiry ID.
let stored; // Track simulated transaction state per test.
let account; // Track the current account fixture per test.
const payload = { fullName: "Ada Example", email: "ada@example.test", message: "Please contact me." }; // Define the minimum public contract.
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } }); // Capture controller responses without sockets.
const invoke = async (handler, body = {}, extra = {}) => { // Call a controller and capture its error middleware output.
  const res = response(); // Create a separate response per call.
  await handler({ body, ...extra }, res, (error) => { res.error = error; }); // Preserve rejected operational failures for assertions.
  return res; // Return the captured result.
}; // End invocation helper.
beforeEach(() => { // Restore all mock state without touching a real database.
  delivery.length = 0; // Clear recorded messages.
  stored = { used: false, passwordWrites: 0, approved: false }; // Reset atomic claim state.
  account = { id: userId, role: "PARENT", deletedAt: null, firstName: "Ada", lastName: "Example", email: payload.email, password: "secret-hash", refreshToken: "secret-token", children: [], therapistAssignments: [], bookingsAsTherapist: [] }; // Include secrets to catch accidental serialization.
  prisma.user = { findUnique: async () => account, findMany: async () => [account], updateMany: async ({ data }) => { if (account.deletedAt) return { count: 0 }; if (data.password) stored.passwordWrites += 1; stored.approved = data.isApproved || false; return { count: 1 }; } }; // Model guarded account writes.
  prisma.otpCode = { findFirst: async () => ({ id: "otp-record" }), create: async () => ({}), updateMany: async ({ where }) => { if (!where.id) return { count: 0 }; assert.equal(where.isUsed, false); assert.ok(where.expiresAt.gt instanceof Date); if (stored.used) return { count: 0 }; stored.used = true; return { count: 1 }; } }; // Simulate a conditional claim with one winner.
  prisma.contactInquiry = { create: async ({ data, select }) => { assert.deepEqual(select, { id: true, createdAt: true }); assert.equal(data.status, undefined); return { id: inquiryId, createdAt: "2026-09-30T00:00:00.000Z" }; }, findMany: async () => [], count: async () => 0, update: async ({ data }) => ({ id: inquiryId, ...data }) }; // Stub durable inquiry operations.
  prisma.$transaction = async (operation) => { if (Array.isArray(operation)) return Promise.all(operation); const snapshot = { ...stored }; try { return await operation(prisma); } catch (error) { stored = snapshot; throw error; } }; // Simulate rollback for controller failure paths.
  contactLimiter.resetKey("127.0.0.1"); // Reset the local HTTP client allowance.
  recoveryLimiter.resetKey("127.0.0.1"); // Isolate recovery attempt counts between tests.
}); // End mock setup.
test("contact schema normalizes input and excludes client-owned status", () => { // Verify the public payload contract.
  const result = contactSchema.parse({ ...payload, fullName: " Ada Example ", email: " ADA@EXAMPLE.TEST ", status: "RESOLVED" }); // Submit normalized and forbidden fields.
  assert.equal(result.fullName, payload.fullName); // Remove surrounding name whitespace.
  assert.equal(result.email, payload.email); // Normalize the email address.
  assert.equal(result.status, undefined); // Keep lifecycle state server-owned.
}); // End normalization test.
test("contact schema rejects blank, malformed, and oversized submissions", () => { // Reject invalid content before persistence.
  for (const change of [{ fullName: " " }, { email: "invalid" }, { message: " " }, { message: "x".repeat(2001) }, { phone: "x".repeat(31) }, { subject: "x".repeat(201) }]) { // Exercise each bounded field.
    assert.equal(contactSchema.safeParse({ ...payload, ...change }).success, false); // Require a validation failure.
  } // End invalid payload cases.
}); // End validation test.
test("contact returns a receipt only after storage succeeds", async () => { // Verify a durable success response.
  const res = await invoke(contact.createInquiry, payload); // Execute the validated submission path.
  assert.equal(res.statusCode, 201); // Match the frontend's successful submission contract.
  assert.equal(res.body.inquiry.id, inquiryId); // Include a stable reference.
  assert.equal(res.body.inquiry.email, undefined); // Do not echo personal data in the receipt.
}); // End receipt test.
test("contact storage failure does not return false success", async () => { // Preserve retryable operational failures.
  prisma.contactInquiry.create = async () => { throw new Error("storage unavailable"); }; // Simulate a database outage.
  const res = await invoke(contact.createInquiry, payload); // Attempt a submission.
  assert.equal(res.body, undefined); // Do not report receipt before persistence.
  assert.equal(res.error.message, "storage unavailable"); // Delegate the failure to the shared error handler.
}); // End failure test.
test("inquiry listing uses bounded parsed pagination and status", async () => { // Verify read-only Express query handling.
  prisma.contactInquiry.findMany = async (args) => { assert.equal(args.skip, 10); assert.equal(args.take, 10); assert.deepEqual(args.where, { status: "NEW" }); return [{ id: inquiryId }]; }; // Inspect query translation.
  prisma.contactInquiry.count = async () => 11; // Return the matching row count.
  const res = await invoke(contact.listInquiries, {}, { query: Object.freeze({ page: "2", limit: "10", status: "NEW" }) }); // Provide immutable string query values.
  assert.deepEqual(res.body.pagination, { page: 2, limit: 10, total: 11 }); // Expose useful typed pagination metadata.
}); // End pagination test.
test("inquiry listing rejects invalid filters", async () => { // Bound queries before calling storage.
  for (const query of [{ limit: "101" }, { page: "0" }, { status: "DELETED" }]) { // Exercise filter failures.
    assert.equal((await invoke(contact.listInquiries, {}, { query })).statusCode, 400); // Reject every invalid query.
  } // End query cases.
}); // End query validation test.
test("missing inquiry status updates return 404", async () => { // Translate Prisma missing-row errors.
  prisma.contactInquiry.update = async () => { throw Object.assign(new Error("missing"), { code: "P2025" }); }; // Simulate a valid but absent ID.
  assert.equal((await invoke(contact.updateInquiryStatus, { status: "RESOLVED" }, { params: { id: inquiryId } })).statusCode, 404); // Return a useful frontend error.
}); // End missing inquiry test.
test("reset responses do not expose account existence through metadata", async () => { // Cover absent, active, and deleted accounts.
  const active = await invoke(auth.requestPasswordReset, { identifier: payload.email }); // Request recovery for an existing user.
  account = null; // Simulate an unknown contact.
  const absent = await invoke(auth.requestPasswordReset, { identifier: payload.email }); // Request recovery with the same submitted target.
  account = { deletedAt: new Date() }; // Simulate a soft-deleted account.
  const deleted = await invoke(auth.requestPasswordReset, { identifier: payload.email }); // Request recovery for a deleted user.
  assert.deepEqual(active.body, absent.body); // Require identical response fields and values.
  assert.deepEqual(active.body, deleted.body); // Do not reveal deleted accounts either.
  assert.equal(delivery.length, 1); // Deliver only for the active account.
}); // End enumeration regression test.
test("SMS reset metadata is also identical for unknown contacts", async () => { // Preserve the phone-based frontend handoff.
  const active = await invoke(auth.requestPasswordReset, { identifier: "+233555123456" }); // Use an SMS target.
  account = null; // Remove the fixture account.
  const absent = await invoke(auth.requestPasswordReset, { identifier: "+233555123456" }); // Repeat the same public request.
  assert.deepEqual(active.body, absent.body); // Keep SMS metadata independent of existence.
  assert.equal(active.body.resetChannel, "SMS"); // Preserve channel routing.
}); // End SMS regression test.
test("parallel password resets have only one successful code consumer", async () => { // Reproduce the old read-before-write race.
  const body = { identifier: payload.email, code: "123456", password: "Password1!" }; // Submit the same valid code twice.
  const results = await Promise.all([invoke(auth.resetPassword, body), invoke(auth.resetPassword, body)]); // Allow both reads before either claim.
  assert.deepEqual(results.map((res) => res.statusCode).sort(), [200, 400]); // Require one winner and one rejected replay.
  assert.equal(stored.passwordWrites, 1); // Ensure only the winner changes credentials.
}); // End reset race test.
test("reset rejects a code that expires before the atomic claim", async () => { // Model expiration during hashing.
  prisma.otpCode.updateMany = async () => ({ count: 0 }); // Make the guarded claim fail despite an earlier valid read.
  const res = await invoke(auth.resetPassword, { identifier: payload.email, code: "123456", password: "Password1!" }); // Attempt the stale reset.
  assert.equal(res.statusCode, 400); // Report an expired or invalid code.
  assert.equal(stored.passwordWrites, 0); // Leave credentials unchanged.
}); // End expiry test.
test("failed password writes roll back code consumption", async () => { // Avoid burning valid codes during database failures.
  prisma.user.updateMany = async () => { throw new Error("write failed"); }; // Fail after the claim.
  const res = await invoke(auth.resetPassword, { identifier: payload.email, code: "123456", password: "Password1!" }); // Exercise transactional failure.
  assert.equal(res.error.message, "write failed"); // Preserve the operational error.
  assert.equal(stored.used, false); // Require rollback of code consumption.
}); // End rollback test.
test("parallel verification requests consume the OTP once", async () => { // Apply the same replay guarantee to signup verification.
  const body = { identifier: payload.email, code: "123456" }; // Reuse one verification code.
  const results = await Promise.all([invoke(auth.verifyOtp, body), invoke(auth.verifyOtp, body)]); // Race the guarded writes.
  assert.deepEqual(results.map((res) => res.statusCode).sort(), [200, 400]); // Require one successful verification.
  assert.equal(stored.approved, true); // Approve the parent only on the successful path.
}); // End verification race test.
test("therapist OTP verification does not grant administrator approval", async () => { // Preserve the clinical approval boundary.
  account.role = "THERAPIST"; // Verify a therapist's contact.
  const res = await invoke(auth.verifyOtp, { identifier: payload.email, code: "123456" }); // Complete the OTP flow.
  assert.equal(res.body.isApproved, false); // Keep approval pending.
  assert.equal(stored.approved, false); // Do not write an approval implicitly.
}); // End approval boundary test.
test("six-character nonnumeric codes fail auth validation", () => { // Match OTP input and generated codes.
  assert.equal(verifyOtpSchema.safeParse({ identifier: payload.email, code: "abcdef" }).success, false); // Reject alphabetic verification codes.
  assert.equal(resetPasswordSchema.safeParse({ identifier: payload.email, code: "abcdef", password: "Password1!" }).success, false); // Reject alphabetic reset codes.
}); // End numeric code test.
test("admin directory payloads never serialize credentials", async () => { // Guard the account-list privacy regression.
  for (const handler of [admin.listParents, admin.listTherapists]) { // Cover both former full-model projections.
    const res = await invoke(handler); // Read the directory fixture containing credentials.
    assert.equal(JSON.stringify(res.body).includes("secret-hash"), false); // Exclude password hashes.
    assert.equal(JSON.stringify(res.body).includes("secret-token"), false); // Exclude refresh tokens.
  } // End directory cases.
}); // End projection test.
const withServer = async (run) => { // Start only the isolated routers, never backend/app.js or setup-server.js.
  const app = express(); // Create an isolated HTTP harness.
  app.use(express.json()); // Parse test JSON bodies.
  app.use("/api/v1/contact", contactRouter); // Mount the real public router.
  app.use("/api/v1/admin", adminRouter); // Mount actual admin guards and inquiry routes.
  app.use("/api/v1/auth", authRouter); // Mount actual recovery rate limiting.
  const server = await new Promise((resolve) => { const instance = app.listen(0, "127.0.0.1", () => resolve(instance)); }); // Allocate a temporary local port.
  try { await run(`http://127.0.0.1:${server.address().port}`); } finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); } // Always stop the test server.
}; // End local HTTP harness.
test("public contact route validates submissions and limits successful writes", async () => { // Verify router wiring and anonymous abuse controls.
  await withServer(async (base) => { // Exercise only loopback HTTP.
    const post = (body) => fetch(`${base}/api/v1/contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); // Submit JSON using the frontend contract.
    assert.equal((await post({ ...payload, message: "" })).status, 400); // Invalid input must not be persisted.
    for (let index = 0; index < 4; index += 1) assert.equal((await post(payload)).status, 201); // Count successful writes as well as failures.
    const limited = await post(payload); // Exceed the five-request allowance.
    assert.equal(limited.status, 429); // Require rate limiting even after successful submissions.
    assert.ok(limited.headers.get("retry-after")); // Give the form a usable retry deadline.
  }); // End public HTTP checks.
}); // End contact router test.
test("admin inquiry routes require authentication and administrator role", async () => { // Verify the production access boundary.
  const oldSecret = process.env.JWT_SECRET; // Preserve the caller's environment.
  process.env.JWT_SECRET = "isolated-local-test-secret"; // Use a test-only signing key.
  try { // Restore environment even if an assertion fails.
    await withServer(async (base) => { // Use real JWT and role middleware.
      assert.equal((await fetch(`${base}/api/v1/admin/inquiries`)).status, 401); // Reject anonymous inbox access.
      const headers = { Authorization: `Bearer ${jwt.sign({ userId }, process.env.JWT_SECRET)}`, "Content-Type": "application/json" }; // Sign a local account token.
      assert.equal((await fetch(`${base}/api/v1/admin/inquiries`, { headers })).status, 403); // Reject parent access.
      account.role = "ADMIN"; // Authorize the fixture as an administrator.
      assert.equal((await fetch(`${base}/api/v1/admin/inquiries`, { headers })).status, 200); // Permit the admin inbox.
      assert.equal((await fetch(`${base}/api/v1/admin/inquiries/${inquiryId}/status`, { method: "PATCH", headers, body: JSON.stringify({ status: "RESOLVED" }) })).status, 200); // Permit a validated status update.
      assert.equal((await fetch(`${base}/api/v1/admin/inquiries/${inquiryId}/status`, { method: "PATCH", headers, body: JSON.stringify({ status: "INVALID" }) })).status, 400); // Reject unknown states.
    }); // End authorization checks.
  } finally { if (oldSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = oldSecret; } // Restore environment without persisting test secrets.
}); // End admin router test.
test("successful password-reset requests consume recovery allowance", async () => { // Prevent unlimited successful email or SMS sends.
  account = null; // Keep this abuse-control test independent of delivery behavior.
  await withServer(async (base) => { // Exercise the real mounted auth router.
    for (let index = 0; index < 21; index += 1) { // Cross the configured twenty-request limit.
      const res = await fetch(`${base}/api/v1/auth/request-password-reset`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: payload.email }) }); // Send a valid recovery request.
      assert.equal(res.status, index < 20 ? 200 : 429); // Count successes, not only failures.
    } // End bounded request sequence.
  }); // End recovery HTTP checks.
}); // End recovery limiter test.
