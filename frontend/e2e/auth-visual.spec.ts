import { expect, test, type Page } from "@playwright/test"; // Verify the Figma OTP composition through real route navigation.

async function enterKnownAccount(page: Page) { // Reproduce the populated OTP state without delivering real messages.
  const user = { id: "figma-account", firstName: "Andrews", lastName: "Kwafo", email: "baahandrewskwafo@gmail.com", phone: null, role: "ADMIN", isApproved: false, avatar: null }; // Match the design's sample copy for visual comparison only.
  await page.route("**/api/v1/**", (route) => { // Isolate every backend request from live data.
    const pathname = new URL(route.request().url()).pathname; // Select fixtures using structured URL parsing.
    return route.fulfill({ json: pathname.endsWith("/auth/login") ? { user, accessToken: "visual-test-token" } : pathname.endsWith("/users/me") ? { user } : {} }); // Provide only the login and profile data this state requires.
  }); // Finish API isolation.
  await page.route("**/socket.io/**", (route) => route.abort()); // Prevent unrelated realtime connections.
  await page.goto("/login"); // Enter through the user-visible signin workflow.
  await expect(page.getByRole("button", { name: "Login", exact: true })).toBeEnabled(); // Wait for session hydration before filling controlled inputs.
  await page.getByLabel("Email / Phone Number").fill(user.email); // Use the design sample account as a local fixture.
  await page.getByLabel("Your Password").fill("VisualTest123!"); // Supply a mock password rather than a real credential.
  await page.getByRole("button", { name: "Login", exact: true }).click(); // Let signin populate the OTP handoff naturally.
  await expect(page).toHaveURL(/\/verify-otp$/); // Confirm the requested verification state loaded.
  await expect(page.getByLabel("Verification digit 1 of 6")).toBeEnabled(); // Wait for profile hydration before measuring controls.
  await page.evaluate(() => document.fonts.ready); // Stabilize typography before layout and screenshot checks.
} // Finish known-account setup.

test("OTP default composition matches the Figma desktop rail and assets", async ({ page }, testInfo) => { // Check frame geometry rather than approving an implementation-generated baseline.
  await page.setViewportSize({ width: 1440, height: 1024 }); // Use node 59:1339's reference canvas.
  await enterKnownAccount(page); // Render the personalized default state.
  const logo = page.getByAltText("Neuro Bridge Africa Logo"); // Resolve the auth-specific stacked logo.
  await expect(logo).toHaveAttribute("src", "/design-assets/auth-logo.png"); // Reject accidental reuse of the horizontal navigation logo.
  await expect(logo).toHaveJSProperty("naturalWidth", 1280); // Confirm the original transparent Figma asset loaded rather than a flattened node export.
  expect(await logo.locator("..").boundingBox()).toMatchObject({ x: 40, y: 281, width: 414, height: 216 }); // Match the source node's crop window and placement.
  const logoImageBox = await logo.boundingBox(); // Inspect the effective image-fill transform inside the clipping window.
  expect(logoImageBox?.width).toBeCloseTo(874.45, 1); // Preserve the Figma source's 211.22 percent horizontal scale.
  expect(logoImageBox?.height).toBeCloseTo(874.93, 1); // Preserve the source's 405.06 percent vertical scale.
  const back = page.getByRole("link", { name: "Go Back" }); // Inspect the exported arrow's callsite.
  expect(await back.locator("img").boundingBox()).toMatchObject({ x: 40, y: 64, width: 24, height: 24 }); // Keep the arrow at its native reference size.
  await expect(back.locator("img")).toHaveJSProperty("naturalWidth", 24); // Ensure the local icon is not a missing placeholder.
  const digit = page.getByLabel("Verification digit 1 of 6"); // Use the first OTP cell as the shared rail origin.
  expect(await digit.boundingBox()).toMatchObject({ x: 603, y: 483, width: 48, height: 48 }); // Match the source default state's field position.
  expect(await page.getByRole("button", { name: "Verify OTP" }).boundingBox()).toMatchObject({ x: 603, y: 555, width: 361, height: 60 }); // Preserve source button geometry and field spacing.
  await expect(page.getByRole("link", { name: "About Neuro Bridge", exact: true })).toBeVisible(); // Keep the full Figma footer on verification pages.
  const footer = page.locator("footer"); // Confirm the measured bottom inset.
  expect((await footer.boundingBox())?.y).toBe(960); // Position the 24px footer forty pixels above the canvas bottom.
  await expect(page.getByRole("button", { name: /Resend code in/ })).toBeDisabled(); // Render the two-minute countdown for a fresh handoff.
  for (const asset of ["/design-assets/auth-logo.png", "/design-assets/icons/auth-back.png", "/design-assets/children-classroom.jpg"]) { // Verify every visible static asset is available locally.
    const response = await page.request.get(asset); // Read asset availability without relying on a temporary Figma URL.
    expect(response.ok()).toBe(true); // Reject missing exported files.
    expect((await response.body()).byteLength).toBeGreaterThan(0); // Reject empty asset placeholders.
  } // Finish local asset checks.
  await page.screenshot({ path: testInfo.outputPath("otp-figma-desktop.png"), fullPage: true }); // Capture evidence for direct comparison with the Figma render.
}); // Finish the reference-size visual test.

test("OTP resend uses the Figma countdown and recovers from failed delivery", async ({ page }) => { // Test the actionable timer states rather than static timer text.
  await page.clock.install(); // Control timers without waiting two real minutes.
  await page.route("**/api/v1/**", (route) => route.fulfill({ json: {} })); // Isolate delivery from real messaging services.
  let deliveries = 0; // Count deliberate resend attempts.
  await page.route("**/api/v1/auth/resend-otp", (route) => { // Reject one delivery before allowing a retry.
    deliveries += 1; // Record each request reaching the backend fixture.
    return route.fulfill(deliveries === 1 ? { status: 503, json: { message: "Delivery unavailable. Please try again." } } : { json: { message: "OTP sent" } }); // Cover failed and successful resend states.
  }); // Finish the resend fixture.
  await page.goto("/verify-otp"); // Direct visitors may supply an account manually.
  await expect(page.getByLabel("Verification digit 1 of 6")).toBeEnabled(); // Wait for React hydration before entering the manual target.
  await page.getByLabel("Email / Phone Number").fill("parent@example.com"); // Set the code destination.
  await page.getByLabel("Verification digit 1 of 6").fill("123456"); // Populate an old code that a successful resend must clear.
  await page.getByRole("button", { name: "Resend code", exact: true }).click(); // Trigger the failed delivery attempt.
  await expect(page.getByRole("alert").filter({ hasText: "Delivery unavailable" })).toBeVisible(); // Keep the delivery error visible beside the resend action.
  await expect(page.getByRole("button", { name: "Resend code", exact: true })).toBeEnabled(); // Do not impose a fresh cooldown after a failed request.
  await page.getByRole("button", { name: "Resend code", exact: true }).click(); // Retry explicitly after the error.
  await expect(page.getByRole("status")).toHaveText("A new verification code has been sent."); // Confirm successful delivery without a floating overlay.
  await expect(page.getByLabel("Verification digit 1 of 6")).toHaveValue(""); // Discard the invalidated old code.
  await expect(page.getByRole("button", { name: /Resend code in/ })).toBeDisabled(); // Block duplicate delivery during the cooldown.
  await page.clock.fastForward(120_000); // Simulate a suspended tab and require the countdown to catch up to its actual deadline.
  await expect(page.getByRole("button", { name: "Resend code", exact: true })).toHaveText("Request a new one"); // Restore the Figma link copy when the timer expires.
  await expect(page.getByRole("button", { name: "Resend code", exact: true })).toBeEnabled(); // Restore the actual action, not just its visual style.
  expect(deliveries).toBe(2); // Ensure countdown progression itself never sends a request.
}); // Finish resend-state coverage.

test("authentication controls wait for hydration before accepting input", async ({ browser, baseURL }) => { // Guard against the first entered value being lost on slow script loading.
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL }); // Inspect real server HTML before React handlers can attach.
  try { // Always close the isolated no-script browser context.
    const page = await context.newPage(); // Keep this readiness check separate from normal interactive fixtures.
    await page.goto("/login"); // Inspect server-rendered signin controls.
    await expect(page.getByLabel("Email / Phone Number")).toBeDisabled(); // Do not advertise editable input before its handler exists.
    await expect(page.getByLabel("Your Password")).toBeDisabled(); // Apply the same protection to password input.
    await page.goto("/verify-otp"); // Inspect the independently rendered OTP fieldset.
    await expect(page.getByLabel("Verification digit 1 of 6")).toBeDisabled(); // Protect paste and autofill from disappearing during hydration.
  } finally { // Release the no-script context even if a readiness assertion fails.
    await context.close(); // Leave later tests using their normal JavaScript-enabled contexts.
  } // Finish isolated readiness verification.
}); // Finish the pre-hydration regression check.
