import { expect, test, type Page } from "@playwright/test"; // Exercise the actual verification route with isolated backend fixtures.

async function openVerification(page: Page) { // Begin each test without real account or message delivery.
  await page.route("**/api/v1/**", (route) => route.fulfill({ json: {} })); // Prevent unexpected requests from reaching a live backend.
  await page.goto("/verify-otp"); // Exercise the thin route and migrated auth feature together.
  await expect(page.getByLabel("Verification digit 1 of 6")).toBeEnabled(); // Wait for session hydration before interacting.
  await page.getByLabel("Email / Phone Number").fill("parent@example.com"); // Supply the target only after client hydration owns the controlled field.
} // Complete the shared route setup.

test("OTP supports typing, replacement, arrows, and backward deletion", async ({ page }) => { // Cover keyboard operation without a mouse-only dependency.
  await openVerification(page); // Render the accessible code group.
  const first = page.getByLabel("Verification digit 1 of 6"); // Resolve each slot by its accessible name.
  const second = page.getByLabel("Verification digit 2 of 6"); // Track auto-advance and backward deletion.
  await first.fill("0"); // Preserve a leading zero in the code.
  await expect(second).toBeFocused(); // Advance to the next empty slot after typing.
  await second.press("Backspace"); // Move backward from an empty slot.
  await expect(first).toHaveValue(""); // Clear the preceding digit as part of backward deletion.
  await expect(first).toBeFocused(); // Keep focus on the newly cleared slot.
  await first.fill("1"); // Re-enter the first digit.
  await second.fill("2"); // Advance once more after the second digit.
  await page.getByLabel("Verification digit 3 of 6").press("ArrowLeft"); // Navigate into an existing digit.
  await expect(second).toBeFocused(); // Keep arrow movement inside the control.
  await second.press("9"); // Replace the selected digit instead of appending to it.
  await expect(second).toHaveValue("9"); // Confirm replacement semantics.
  await page.getByLabel("Verification digit 3 of 6").fill("x"); // Reject non-numeric typed content.
  await expect(page.getByRole("button", { name: "Verify OTP" })).toBeDisabled(); // Prevent submission of an incomplete code.
}); // Complete keyboard coverage.

test("OTP distributes pasted and autofilled codes without losing leading zeroes", async ({ page }) => { // Cover common mobile and password-manager entry paths.
  await openVerification(page); // Load an independent verification form.
  await page.getByLabel("Verification digit 3 of 6").evaluate((input) => { // Paste a complete code from a non-first slot.
    const clipboardData = new DataTransfer(); // Create the browser's native clipboard payload.
    clipboardData.setData("text/plain", "00 1234"); // Include formatting and two leading zeroes.
    input.dispatchEvent(new ClipboardEvent("paste", { clipboardData, bubbles: true })); // Exercise the real React paste handler.
  }); // Finish simulated clipboard delivery.
  for (const [index, digit] of [..."001234"].entries()) { // Inspect all positions rather than only the first input.
    await expect(page.getByLabel(`Verification digit ${index + 1} of 6`)).toHaveValue(digit); // Verify the complete pasted code.
  } // Finish paste assertions.
  await page.getByLabel("Verification digit 1 of 6").fill("654321"); // Simulate full-code browser autofill.
  for (const [index, digit] of [..."654321"].entries()) { // Check autofill uses the same distribution logic.
    await expect(page.getByLabel(`Verification digit ${index + 1} of 6`)).toHaveValue(digit); // Preserve exactly one digit per slot.
  } // Finish autofill assertions.
  await expect(page.getByRole("button", { name: "Verify OTP" })).toBeEnabled(); // Allow submission only once all positions are filled.
}); // Complete paste and autofill coverage.

test("verification locks pending inputs, exposes errors, and permits a corrected retry", async ({ page }) => { // Cover the request lifecycle as well as the visual control.
  await openVerification(page); // Render the direct-navigation recovery path.
  await page.evaluate(() => sessionStorage.setItem("neurobridge.pendingVerification", JSON.stringify({ userId: "previous-signup", identifier: "parent@example.com", channel: "EMAIL" }))); // Seed a tab handoff to verify successful completion clears obsolete metadata.
  let requests = 0; // Detect accidental duplicate submissions.
  let release: () => void = () => {}; // Allow the test to finish the pending request explicitly.
  const pending = new Promise<void>((resolve) => { release = resolve; }); // Hold the first response until pending behavior is inspected.
  await page.route("**/api/v1/auth/verify-otp", async (route) => { // Override only verification while retaining the fallback fixture.
    requests += 1; // Record the number of submitted attempts.
    expect(route.request().postDataJSON()).toMatchObject({ identifier: "parent@example.com", channel: "EMAIL", code: requests === 1 ? "123456" : "654321" }); // Verify the complete backend contract.
    if (requests === 1) { // Reject the first code after testing the pending UI.
      await pending; // Keep the response pending without timing-based sleeps.
      await route.fulfill({ status: 400, json: { message: "Wrong OTP entered." } }); // Exercise real backend-error normalization.
    } else await route.fulfill({ json: { isApproved: true } }); // Permit the corrected attempt.
  }); // Finish controlled verification fixture.
  await page.getByLabel("Verification digit 1 of 6").fill("123456"); // Enter a complete initial code.
  await page.getByRole("button", { name: "Verify OTP" }).click(); // Start verification.
  try { // Always release the held response even if a pending assertion fails.
    await expect(page.getByRole("button", { name: "Verifying" })).toBeDisabled(); // Block repeated clicks.
    await expect(page.getByRole("button", { name: "Verifying" })).toHaveAttribute("aria-busy", "true"); // Announce the pending action.
    await expect(page.getByLabel("Verification digit 1 of 6")).toBeDisabled(); // Prevent changing the code while the server evaluates it.
    await expect(page.getByRole("button", { name: /Resend code/ })).toBeDisabled(); // Prevent invalidating an in-flight code.
    expect(requests).toBe(1); // Confirm that only one verification request was sent.
  } finally { release(); } // Let the rejected response settle and unlock retry.
  await expect(page.getByRole("alert").filter({ hasText: "Wrong OTP entered." })).toBeVisible(); // Surface the actionable backend error.
  await expect(page.getByLabel("Verification digit 1 of 6")).toHaveAttribute("aria-invalid", "true"); // Associate failure with the digit controls.
  await expect(page.getByLabel("Verification digit 1 of 6")).toHaveCSS("border-color", "rgb(229, 57, 53)"); // Match the Figma error-state border.
  await page.getByLabel("Verification digit 1 of 6").fill("654321"); // Correct the code using full-code autofill.
  await expect(page.getByLabel("Verification digit 1 of 6")).toHaveAttribute("aria-invalid", "false"); // Clear stale invalid state on correction.
  await page.getByRole("button", { name: "Verify OTP" }).click(); // Retry after the server rejection.
  await expect(page).toHaveURL(/\/login$/); // Direct visitors must sign in after verification rather than gaining a fabricated session.
  expect(await page.evaluate(() => sessionStorage.getItem("neurobridge.pendingVerification"))).toBeNull(); // Do not restore a completed verification after later navigation.
  expect(requests).toBe(2); // Verify exactly one initial attempt and one deliberate retry.
}); // Complete the verification lifecycle regression test.

test("OTP matches reference geometry and fits narrow mobile screens", async ({ page }, testInfo) => { // Check reference size and responsive constraints independently.
  await page.setViewportSize({ width: 1440, height: 1024 }); // Use the Figma screen's desktop viewport.
  await openVerification(page); // Render the production component through its route.
  const digit = page.getByLabel("Verification digit 1 of 6"); // Inspect a representative cell.
  await expect(digit).toHaveCSS("width", "48px"); // Match the exact desktop cell width.
  await expect(digit).toHaveCSS("height", "48px"); // Keep the reference square aspect ratio.
  await expect(digit).toHaveCSS("border-radius", "8px"); // Match the Figma corner radius.
  for (const width of [1440, 390, 320]) { // Exercise desktop and both common and narrow phone sizes.
    await page.setViewportSize({ width, height: width === 1440 ? 1024 : 844 }); // Keep all six inputs inside each viewport.
    await page.evaluate(() => document.fonts.ready); // Stabilize typography before screenshot capture.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); // Reject horizontal overflow.
    await expect(page.getByLabel("Verification digit 6 of 6")).toBeInViewport(); // Ensure the last digit remains reachable without scrolling sideways.
    await page.screenshot({ path: testInfo.outputPath(`otp-${width}.png`), fullPage: true }); // Record review evidence without claiming full-screen visual parity.
  } // Finish viewport coverage.
}); // Complete geometry verification.
