import { expect, test, type Page } from "@playwright/test"; // Verify signup geometry and the real form's API payload without creating live accounts.
async function openSignup(page: Page, role: string) { // Isolate authentication from external services.
  await page.route("**/api/v1/**", (route) => route.fulfill({ json: {} })); // Block unconfigured API traffic.
  await page.route("**/socket.io/**", (route) => route.abort()); // Suppress unrelated realtime connections.
  await page.goto(`/register?role=${role}`); // Exercise the actual public route.
  await expect(page.getByLabel("Date of Birth")).toBeEnabled(); // Wait until controlled fields have hydrated.
  await page.evaluate(() => document.fonts.ready); // Stabilize typography before measurement.
} // Finish isolated setup.
for (const role of ["PARENT", "THERAPIST"]) { // Verify both source signup compositions.
  test(`${role} signup matches Figma geometry and fits mobile`, async ({ page }, info) => { // Check measured coordinates rather than approving a generated baseline.
    await page.setViewportSize({ width: 1440, height: 1024 }); // Match the source artboard.
    await openSignup(page, role); // Select the role-specific fields.
    expect(await page.getByRole("heading", { level: 1 }).boundingBox()).toMatchObject({ x: 603, y: 243, height: 38 }); // Preserve the source heading origin.
    expect(await page.getByLabel(role === "PARENT" ? "First Name" : "Full Name").boundingBox()).toMatchObject({ x: 603, y: 357, width: 361, height: 60 }); // Match the first source control.
    expect(await page.getByLabel("Create Your Password").boundingBox()).toMatchObject({ x: 603, y: 597, width: 361, height: 60 }); // Match the third source row.
    expect(await page.getByRole("button", { name: "Sign Up", exact: true }).boundingBox()).toMatchObject({ x: 795.5, y: 681, width: 361, height: 60 }); // Preserve the centered primary action.
    await expect(page.getByRole("link", { name: "Login", exact: true })).toHaveAttribute("href", `/login?role=${role}`); // Keep the audience on the return link.
    await expect(page.getByRole("button", { name: "Show password", exact: true }).locator("img")).toHaveJSProperty("naturalWidth", 24); // Verify the original visibility asset loaded.
    const calendar = await page.request.get("/design-assets/icons/auth-calendar.svg"); // Check the calendar is local and nonempty.
    expect(calendar.ok() && (await calendar.body()).byteLength > 0).toBe(true); // Reject a missing or empty export.
    await page.screenshot({ path: info.outputPath(`signup-${role}.png`), fullPage: true }); // Retain a desktop visual comparison artifact.
    for (const width of [390, 320]) { // Check both ordinary and narrow mobile widths.
      await page.setViewportSize({ width, height: 844 }); // Adapt without scaling font sizes by viewport width.
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); // Reject overflow from text or controls.
      await page.screenshot({ path: info.outputPath(`signup-${role}-${width}.png`), fullPage: true }); // Retain responsive evidence.
    } // Finish mobile checks.
  }); // Finish the role-specific visual test.
} // Finish the default-state matrix.
test("therapist signup locks the payload and recovers from API rejection", async ({ page }) => { // Verify request state and retry without sending real OTPs.
  await openSignup(page, "THERAPIST"); // Use the specialization-specific form.
  let release = () => {}; // Hold the response until pending assertions complete.
  const gate = new Promise<void>((resolve) => { release = resolve; }); // Control the API response timing.
  let attempts = 0; // Detect duplicate registration requests.
  await page.route("**/api/v1/auth/register", async (route) => { // Observe the actual serialized backend contract.
    attempts += 1; // Record deliberate submissions.
    expect(route.request().postDataJSON()).toMatchObject({ firstName: "Ama", lastName: "Mensah", email: "ama@example.com", identifier: "ama@example.com", dateOfBirth: "1990-01-01", role: "THERAPIST", areaofexpertise: "Speech Therapy", password: "BridgeTest123!" }); // Preserve the existing role and contact contract.
    await gate; // Leave time to inspect the locked form.
    await route.fulfill({ status: 503, json: { message: "Registration unavailable. Please retry." } }); // Return an honest service failure.
  }); // Finish request isolation.
  await page.getByLabel("Full Name").fill("Ama Mensah"); // Populate the Figma full-name control.
  await page.getByLabel("Date of Birth").fill("1990-01-01"); // Exercise the native date input.
  await page.getByLabel("Email or Phone Number").fill(" ama@example.com "); // Check whitespace normalization.
  await page.getByLabel("Area of Expertise").selectOption("Speech Therapy"); // Choose a real specialization.
  await page.getByLabel("Create Your Password").fill("BridgeTest123!"); // Supply a valid fixture password.
  await page.getByLabel("Confirm Your Password").fill("BridgeTest123!"); // Satisfy confirmation validation.
  await page.getByRole("button", { name: "Sign Up", exact: true }).click(); // Begin one registration attempt.
  await expect(page.getByLabel("Full Name")).toBeDisabled(); // Keep the submitted identity immutable while pending.
  await expect(page.getByLabel("Area of Expertise")).toBeDisabled(); // Lock native selects as well as text fields.
  await expect(page.getByRole("button", { name: "Show password", exact: true })).toBeDisabled(); // Lock the visibility action consistently.
  await expect(page.getByRole("button", { name: "Loading" })).toBeDisabled(); // Prevent another registration request.
  release(); // Deliver the rejected response.
  await expect(page.getByRole("alert").filter({ hasText: "Registration unavailable" })).toBeVisible(); // Show the server's actual feedback.
  await expect(page.getByLabel("Full Name")).toBeEnabled(); // Allow correction after failure.
  await expect(page.getByLabel("Create Your Password")).toHaveValue("BridgeTest123!"); // Preserve input for an intentional retry.
  await page.getByLabel("Full Name").fill("Ama Mensah Updated"); // Correct the form without reloading.
  await expect(page.getByRole("alert").filter({ hasText: "Registration unavailable" })).toHaveCount(0); // Ignore Next's empty route announcer while checking stale feedback.
  expect(attempts).toBe(1); // Never retry registration automatically.
}); // Finish the pending/rejection contract test.
