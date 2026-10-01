import { expect, test, type Page } from "@playwright/test"; // Verify recovery and inquiry contracts without sending live messages.
async function isolate(page: Page) { // Block all unconfigured API and realtime traffic.
  await page.route("**/api/v1/**", (route) => route.fulfill({ json: {} })); // Keep tests independent of database credentials.
  await page.route("**/socket.io/**", (route) => route.abort()); // Prevent unrelated realtime traffic.
} // Finish network isolation.
test("forgot password matches Figma and routes lost access to contact", async ({ page }, info) => { // Verify the measured source default and its mapped route.
  await isolate(page); // Avoid real recovery delivery.
  await page.setViewportSize({ width: 1440, height: 1024 }); // Match the reference artboard.
  const errors: string[] = []; // Capture hydration failures as real defects.
  page.on("pageerror", (error) => errors.push(error.message)); // Observe browser runtime errors.
  await page.goto("/forgot-password"); // Open the actual public route.
  await expect(page.getByLabel("Email / Phone Number")).toBeEnabled(); // Wait for controlled-field hydration.
  await page.evaluate(() => document.fonts.ready); // Stabilize text geometry.
  expect(await page.getByRole("heading", { name: "Forgot Password" }).boundingBox()).toMatchObject({ x: 603, y: 345, height: 30 }); // Match the source title.
  expect(await page.getByLabel("Email / Phone Number").boundingBox()).toMatchObject({ x: 603, y: 495, width: 361, height: 60 }); // Match source field coordinates.
  await page.screenshot({ path: info.outputPath("forgot-password.png"), fullPage: true }); // Save visual evidence for review.
  await page.getByRole("link", { name: "Lost access to your email and phone number?" }).click(); // Exercise the mapped support route.
  await expect(page).toHaveURL(/\/contact\?subject=Account%20recovery$/); // Preserve account-recovery context.
  await expect(page.getByRole("heading", { name: "Contact Administrator with Your Account Problems" })).toBeVisible(); // Ensure unauthenticated users are not redirected to signin.
  expect(errors).toEqual([]); // Reject hydration or render failures.
}); // Finish recovery navigation coverage.
for (const identifier of ["parent@example.com", "+233501111111"]) { // Cover email and SMS recovery payloads.
  test(`reset preserves target, code positions, and retry for ${identifier}`, async ({ page }, info) => { // Exercise the two-step flow without bypassing server code checks.
    await isolate(page); // Avoid real accounts and password changes.
    await page.setViewportSize({ width: 1440, height: 1024 }); // Match the password source canvas.
    await page.route("**/api/v1/auth/request-password-reset", (route) => route.fulfill({ json: { message: "If the account exists, a code was sent.", resetIdentifier: identifier, resetChannel: identifier.includes("@") ? "EMAIL" : "SMS" } })); // Use the backend's account-neutral response.
    let attempts = 0; // Require deliberate retry after an invalid code.
    await page.route("**/api/v1/auth/reset-password", async (route) => { // Assert the unchanged reset transaction contract.
      attempts += 1; // Count final password submissions only.
      expect(route.request().postDataJSON()).toEqual({ identifier, channel: identifier.includes("@") ? "EMAIL" : "SMS", code: attempts === 1 ? "012345" : "654321", password: "ResetPass123!" }); // Keep leading zeroes and the selected contact channel.
      await route.fulfill(attempts === 1 ? { status: 400, json: { message: "Invalid or expired reset code" } } : { json: { message: "Password reset successfully. You can now sign in." } }); // Reject the first code, then accept the user's corrected attempt.
    }); // Finish the API fixture.
    await page.goto("/forgot-password"); // Begin at code delivery.
    await page.getByLabel("Email / Phone Number").fill(identifier); // Enter the selected contact channel.
    await page.getByRole("button", { name: "Get Password Reset Code" }).click(); // Request a code through the real form handler.
    await expect(page.getByLabel("Account Email / Phone Number")).toHaveValue(identifier); // Verify the session handoff.
    await page.getByLabel("Verification digit 1 of 6").fill("012345"); // Paste a six-digit code with a leading zero.
    await page.getByLabel("Verification digit 3 of 6").fill(""); // Clear a middle digit without shifting later cells.
    await expect(page.getByLabel("Verification digit 4 of 6")).toHaveValue("3"); // Preserve positional OTP editing.
    await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeDisabled(); // Require all six code positions.
    await page.getByLabel("Verification digit 3 of 6").fill("2"); // Repair the missing digit.
    await page.getByRole("button", { name: "Continue", exact: true }).click(); // Move locally to the source password form.
    expect(attempts).toBe(0); // Never treat local code entry as successful backend verification.
    await page.evaluate(() => document.fonts.ready); // Stabilize source typography.
    expect(await page.getByRole("heading", { name: "Create New Password" }).boundingBox()).toMatchObject({ x: 603, y: 289, height: 38 }); // Match the source title geometry.
    expect(await page.getByLabel("New Password", { exact: true }).boundingBox()).toMatchObject({ x: 603, y: 447, width: 361, height: 60 }); // Keep the new-password field on the measured rail.
    await expect(page.getByRole("button", { name: "Submit", exact: true })).toHaveCSS("background-color", "rgb(181, 211, 238)"); // Wait for the disabled-state transition before taking a source comparison screenshot.
    await page.screenshot({ path: info.outputPath("create-password.png"), fullPage: true }); // Retain the source two-field composition.
    await page.getByLabel("New Password", { exact: true }).fill("ResetPass123!"); // Enter a valid replacement.
    await page.getByLabel("Confirm New Password", { exact: true }).fill("ResetPass123!"); // Confirm the replacement.
    await page.getByRole("button", { name: "Submit", exact: true }).click(); // Let the backend validate the complete transaction.
    await expect(page.getByRole("alert").filter({ hasText: "Invalid or expired" })).toBeVisible(); // Display actual invalid-code feedback.
    await page.getByLabel("Verification digit 1 of 6").fill("654321"); // Correct the rejected code without losing the target.
    await page.getByRole("button", { name: "Continue", exact: true }).click(); // Return to the retained password fields.
    await page.getByRole("button", { name: "Submit", exact: true }).click(); // Make one intentional retry.
    await expect(page.getByRole("status")).toContainText("Password reset successfully"); // Require server-confirmed completion.
    await expect(page.getByLabel("New Password", { exact: true })).toHaveCount(0); // Remove sensitive controls after completion.
    expect(attempts).toBe(2); // Never retry password changes automatically.
  }); // Finish one contact channel.
} // Finish recovery transport coverage.
test("contact matches Figma, persists a receipt, and retains rejected input", async ({ page }, info) => { // Cover source geometry and truthful submission states.
  await isolate(page); // Prevent real administrator contact messages.
  await page.setViewportSize({ width: 1440, height: 1024 }); // Match the contact frame.
  await page.goto("/contact?subject=Account%20recovery"); // Preserve the recovery topic in the real route.
  await expect(page.getByLabel("Full Name")).toBeEnabled(); // Wait for controlled inputs to hydrate.
  await page.evaluate(() => document.fonts.ready); // Stabilize heading measurement.
  expect(await page.getByRole("heading", { level: 1 }).boundingBox()).toMatchObject({ x: 603, y: 183, height: 38 }); // Match the source heading origin.
  expect(await page.getByLabel("Full Name").boundingBox()).toMatchObject({ x: 603, y: 397, width: 361, height: 60 }); // Match the first source control.
  await expect(page.locator("footer")).toHaveCount(0); // Preserve the footer-free contact artboard.
  await expect(page.locator('img[src="/design-assets/contact-side.png"]')).toHaveJSProperty("complete", true); // Wait for the original contact image.
  await page.screenshot({ path: info.outputPath("contact-default.png"), fullPage: true }); // Save the actual rendering for source comparison.
  let attempts = 0; // Reject once to exercise retry behavior.
  await page.route("**/api/v1/contact", async (route) => { // Observe real submitted field names.
    attempts += 1; // Count deliberate submissions.
    expect(route.request().postDataJSON()).toEqual({ fullName: "Ama Mensah", email: "ama@example.com", message: "I cannot access my account.", subject: "Account recovery" }); // Keep the reviewed contact contract.
    await route.fulfill(attempts === 1 ? { status: 503, json: { message: "Storage unavailable. Please retry." } } : { status: 201, json: { message: "Your message has been received.", inquiry: { id: "inquiry-test", createdAt: "2026-09-30T00:00:00Z" } } }); // Confirm receipt only after persistence succeeds.
  }); // Finish the contact transport fixture.
  await page.getByLabel("Full Name").fill("Ama Mensah"); // Fill the sender name.
  await page.getByLabel("Email", { exact: false }).fill("ama@example.com"); // Supply a valid reply address.
  await page.getByLabel("Message", { exact: true }).fill("I cannot access my account."); // Supply meaningful message content.
  await page.getByRole("button", { name: "Submit", exact: true }).click(); // Exercise the intentionally failed persistence attempt.
  await expect(page.getByRole("alert").filter({ hasText: "Storage unavailable" })).toBeVisible(); // Show the actual storage failure.
  await expect(page.getByLabel("Message", { exact: true })).toHaveValue("I cannot access my account."); // Preserve the user's account details for retry.
  await page.setViewportSize({ width: 320, height: 844 }); // Verify mobile failure layout as well as the default desktop frame.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); // Reject horizontal overflow.
  await page.screenshot({ path: info.outputPath("contact-error-mobile.png"), fullPage: true }); // Retain mobile evidence.
  await page.getByRole("button", { name: "Submit", exact: true }).click(); // Retry deliberately.
  await expect(page.getByRole("status")).toContainText("Your message has been received."); // Do not claim that a delivery provider sent email.
  expect(attempts).toBe(2); // Record exactly one failure and one retry.
}); // Finish contact page coverage.
test("landing contact sends a real payload and maps footer links", async ({ page }) => { // Verify the pre-existing landing form is no longer a no-op.
  await isolate(page); // Keep public submissions isolated.
  await page.route("**/api/v1/contact", (route) => { expect(route.request().postDataJSON()).toEqual({ fullName: "Ama Mensah", email: "ama@example.com", subject: "parent-support", message: "Please contact me." }); return route.fulfill({ status: 201, json: { message: "Your message has been received.", inquiry: { id: "landing-test", createdAt: "2026-09-30T00:00:00Z" } } }); }); // Assert the actual form-to-API mapping.
  await page.goto("/"); // Exercise the real landing route.
  await page.getByLabel("Your Name", { exact: true }).fill("Ama Mensah"); // Supply sender identity.
  await page.getByLabel("Email Address", { exact: true }).fill("ama@example.com"); // Supply a reply address.
  await page.getByLabel("Subject", { exact: true }).selectOption("parent-support"); // Preserve the visible topic selection.
  await page.getByLabel("Message", { exact: true }).fill("Please contact me."); // Fill the bounded message body.
  await page.getByRole("button", { name: "Submit", exact: true }).click(); // Save the inquiry using the new handler.
  await expect(page.getByRole("status")).toContainText("Your message has been received."); // Require API acceptance before confirmation.
  await expect(page.getByLabel("Message", { exact: true })).toHaveValue(""); // Clear submitted personal details after success.
  await expect(page.locator("footer").getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy"); // Keep policy navigation functional.
}); // Finish landing behavior coverage.
test("admin inquiries use persisted filters and status rather than conversation identities", async ({ page }) => { // Exercise the complete public-contact-to-admin contract with isolated records.
  await isolate(page); // Prevent live administrative requests.
  await page.addInitScript(() => localStorage.setItem("accessToken", "admin-test-token")); // Bootstrap a mocked authenticated admin session.
  const user = { id: "admin-test", firstName: "Ama", lastName: "Admin", role: "ADMIN", email: "admin@example.com", phone: null, avatar: null, isApproved: true }; // Keep fixture privileges explicit.
  await page.route("**/api/v1/users/me", (route) => route.fulfill({ json: { user } })); // Match the profile hydration envelope.
  await page.route("**/api/v1/notifications**", (route) => route.fulfill({ json: { notifications: [], unreadCount: 0 } })); // Isolate authenticated notification reads.
  let savedStatus = "NEW"; // Model durable backend status across subsequent list requests.
  const inquiry = { id: "db42d224-0954-4661-a71a-617b788c75dc", fullName: "Support Sender", email: "sender@example.com", phone: null, subject: "Account recovery", message: "I need help accessing my account.", createdAt: "2026-09-30T00:00:00Z" }; // Use an unverified public sender, not a platform account.
  await page.route("**/api/v1/admin/inquiries**", async (route) => { // Serve the documented admin endpoint shape.
    if (route.request().method() === "PATCH") { // Persist one explicit status change.
      expect(route.request().postDataJSON()).toEqual({ status: "IN_PROGRESS" }); // Send only the allowed workflow field.
      savedStatus = "IN_PROGRESS"; // Retain the changed status for the next GET.
      return route.fulfill({ json: { message: "Inquiry status updated", inquiry: { ...inquiry, status: savedStatus } } }); // Return the saved result.
    } // Finish the mutation fixture.
    const filter = new URL(route.request().url()).searchParams.get("status"); // Inspect real server-side filter parameters.
    const rows = !filter || filter === savedStatus ? [{ ...inquiry, status: savedStatus }] : []; // Apply the filter to persisted state.
    return route.fulfill({ json: { inquiries: rows, pagination: { page: 1, limit: 25, total: rows.length } } }); // Return bounded rows and the matching count.
  }); // Finish admin API isolation.
  await page.goto("/admin/complaints"); // Enter through the protected support route.
  await expect(page.getByRole("heading", { name: "Contact Inquiries" })).toBeVisible(); // Open the public inquiry queue rather than private conversations.
  await expect(page.getByText("Support Sender", { exact: true })).toBeVisible(); // Show the actual persisted sender.
  await expect(page.getByRole("columnheader", { name: "Platform Role" })).toHaveCount(0); // Never invent a verified account role for public contact data.
  await page.getByLabel("Status for Support Sender").selectOption("IN_PROGRESS"); // Persist workflow progress through the actual selector.
  await expect(page.getByLabel("Status for Support Sender")).toHaveValue("IN_PROGRESS"); // Require the reloaded backend state.
  await page.getByLabel("Filter inquiry status").selectOption("RESOLVED"); // Filter the backend result, not only the current table page.
  await expect(page.getByText("No contact inquiries found.")).toBeVisible(); // Show an honest filtered empty state.
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled(); // Respect bounded pagination.
}); // Finish admin inquiry coverage.
