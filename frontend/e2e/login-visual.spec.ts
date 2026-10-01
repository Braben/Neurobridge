import { expect, test, type Page } from "@playwright/test"; // Check signin against measured Figma frames and real browser interaction.
async function openLogin(page: Page, query = "") { // Keep visual checks isolated from live accounts.
  await page.route("**/api/v1/**", (route) => route.fulfill({ json: {} })); // Prevent real authentication or email delivery.
  await page.route("**/socket.io/**", (route) => route.abort()); // Exclude unrelated realtime traffic.
  await page.goto(`/login${query}`); // Exercise the public route adapter rather than an isolated component.
  await expect(page.getByLabel("Email / Phone Number")).toBeEnabled(); // Wait until controlled inputs can safely retain typing.
  await page.evaluate(() => document.fonts.ready); // Stabilize typography before geometry assertions.
} // Finish isolated signin setup.
for (const audience of ["PARENT", "THERAPIST"] as const) { // Verify both audience-specific source frames.
  test(`${audience} signin matches the Figma default frame`, async ({ page }, testInfo) => { // Use measured coordinates, not a self-approved screenshot baseline.
    await page.setViewportSize({ width: 1440, height: 1024 }); // Match the source canvas.
    await openLogin(page, `?role=${audience}`); // Select the matching Figma greeting through its URL.
    const title = page.getByRole("heading", { name: `Login to your account, dear ${audience.toLowerCase()}` }); // Preserve the role-specific wording.
    expect(await title.boundingBox()).toMatchObject({ x: 603, y: 314, height: 38 }); // Keep the title in a wider block above the controls.
    expect(await page.getByLabel("Email / Phone Number").boundingBox()).toMatchObject({ x: 603, y: 428, width: 361, height: 60 }); // Match the first field's source position.
    expect(await page.getByLabel("Your Password").boundingBox()).toMatchObject({ x: 603, y: 548, width: 361, height: 60 }); // Match the 24px field-group separation.
    const toggle = page.getByRole("button", { name: "Show password" }); // Locate the native visibility action by its accessible name.
    expect(await toggle.locator("img").boundingBox()).toMatchObject({ x: 924, y: 566, width: 24, height: 24 }); // Keep the source icon within its intended trailing slot.
    await expect(toggle.locator("img")).toHaveJSProperty("naturalWidth", 24); // Reject a missing or incorrectly scaled static asset.
    await expect(toggle.locator("img")).toHaveAttribute("src", "/design-assets/icons/password-hidden-empty.svg"); // Use the exact pale-blue empty-state glyph.
    const submit = page.getByRole("button", { name: "Login", exact: true }); // Identify the primary signin action.
    await expect(submit).toBeDisabled(); // The source empty state must not submit blank credentials.
    expect(await submit.boundingBox()).toMatchObject({ x: 603, y: 656, width: 361, height: 60 }); // Match the source primary control position and dimensions.
    await expect(submit).toHaveCSS("background-color", "rgb(181, 211, 238)"); // Preserve the Figma disabled fill.
    await expect(page.getByRole("link", { name: "Sign Up", exact: true })).toHaveAttribute("href", `/register?role=${audience}`); // Carry the selected audience into signup.
    expect((await page.locator("footer").boundingBox())?.y).toBe(960); // Retain the shared reference footer position.
    await page.screenshot({ path: testInfo.outputPath(`login-${audience.toLowerCase()}.png`), fullPage: true }); // Capture source-comparison evidence for both headings.
  }); // Finish this audience's default-state checks.
} // Finish role-specific geometry coverage.
test("signin filled fields and visibility preserve values and geometry", async ({ page }) => { // Verify original icons and functional password visibility.
  await openLogin(page); // Keep the neutral shared route available to all account types.
  await page.getByLabel("Email / Phone Number").fill("parent@example.com"); // Populate the identifier without submitting it.
  await page.getByLabel("Your Password").fill("BridgeTest123!"); // Use a fixture rather than real credentials.
  const submit = page.getByRole("button", { name: "Login", exact: true }); // Inspect the filled-state primary control.
  await expect(submit).toBeEnabled(); // Enable signin once both required values exist.
  await expect(page.getByLabel("Email / Phone Number")).toHaveCSS("border-color", "rgb(10, 61, 98)"); // Retain the source filled border after blur.
  const before = await page.getByLabel("Your Password").boundingBox(); // Record dimensions before toggling visibility.
  await expect(page.getByRole("button", { name: "Show password" }).locator("img")).toHaveAttribute("src", "/design-assets/icons/password-hidden.svg"); // Use the dark filled-state hidden icon.
  await page.getByRole("button", { name: "Show password" }).click(); // Reveal the existing password without submitting the form.
  await expect(page.getByLabel("Your Password")).toHaveAttribute("type", "text"); // Confirm actual visibility rather than a decorative icon change.
  await expect(page.getByRole("button", { name: "Hide password" }).locator("img")).toHaveAttribute("src", "/design-assets/icons/password-visible.svg"); // Use the design system's visible variant.
  await expect(page.getByRole("button", { name: "Hide password" })).toHaveAttribute("title", "Hide password"); // Expose the changing action as a hover tooltip.
  await page.getByRole("button", { name: "Hide password" }).click(); // Restore password masking.
  await expect(page.getByLabel("Your Password")).toHaveValue("BridgeTest123!"); // Preserve the entire value across both toggles.
  expect(await page.getByLabel("Your Password").boundingBox()).toEqual(before); // Never resize the field as its content changes.
  for (const name of ["password-hidden-empty", "password-hidden", "password-visible", "auth-loading", "auth-warning"]) { // Check every static asset introduced by this screen.
    const asset = await page.request.get(`/design-assets/icons/${name}.svg`); // Ensure the icons are served locally, not from expiring Figma URLs.
    expect(asset.ok()).toBe(true); // Reject missing asset paths.
    expect((await asset.body()).byteLength).toBeGreaterThan(0); // Reject empty placeholders.
  } // Finish local asset checks.
}); // Finish filled-state and visibility coverage.
test("signin locks pending credentials and preserves truthful retry feedback", async ({ page }, testInfo) => { // Exercise pending and rejected states without real authentication.
  await openLogin(page); // Load the normal signin page first.
  let release: () => void = () => {}; // Hold the response while pending controls are inspected.
  const responseGate = new Promise<void>((resolve) => { release = resolve; }); // Release the mocked backend only after assertions finish.
  let attempts = 0; // Count requests reaching the backend fixture.
  await page.route("**/api/v1/auth/login", async (route) => { attempts += 1; await responseGate; await route.fulfill({ status: 503, json: { message: "Service unavailable. Please retry." } }); }); // Model an outage rather than inventing an incorrect-password response.
  await page.getByLabel("Email / Phone Number").fill("parent@example.com"); // Enter the account fixture.
  await page.getByLabel("Your Password").fill("BridgeTest123!"); // Enter the password fixture.
  await page.getByRole("button", { name: "Login", exact: true }).click(); // Start exactly one deliberate attempt.
  await expect(page.getByRole("button", { name: "Loading" })).toBeDisabled(); // Prevent another click during the request.
  await expect(page.getByLabel("Your Password")).toBeDisabled(); // Do not let typed values diverge from the submitted payload.
  await expect(page.getByRole("button", { name: "Show password" })).toBeDisabled(); // Keep all password actions consistent with the request lock.
  const spinner = page.getByRole("button", { name: "Loading" }).locator("img"); // Measure the original image size rather than its changing rotated bounding rectangle.
  await expect(spinner).toHaveCSS("width", "24px"); // Preserve the source width while the icon rotates.
  await expect(spinner).toHaveCSS("height", "24px"); // Preserve the source height while the icon rotates.
  await expect(spinner).toHaveJSProperty("naturalWidth", 24); // Wait for the actual SVG to load before accepting an empty image slot.
  await page.emulateMedia({ reducedMotion: "reduce" }); // Exercise the accessible reduced-motion variant.
  await expect(spinner).toHaveCSS("animation-name", "none"); // Keep pending feedback available without forced animation.
  release(); // Allow the rejected response to reach Redux.
  const alert = page.getByRole("alert").filter({ hasText: "Service unavailable" }); // Inspect the actual server feedback.
  await expect(alert).toBeVisible(); // Retain an actionable reason for retry.
  await expect(alert.locator("img")).toHaveJSProperty("naturalWidth", 24); // Wait for the warning asset to decode before capturing its visual state.
  await expect(page.getByText("Password incorrect", { exact: true })).toHaveCount(0); // Do not misdiagnose an outage as a credential problem.
  expect(await alert.locator("img").boundingBox()).toMatchObject({ width: 24, height: 24 }); // Preserve the warning glyph's source size.
  await page.setViewportSize({ width: 320, height: 844 }); // Check rejection feedback on a narrow phone as well as desktop.
  const alertBox = (await alert.boundingBox())!; // Measure the notification's reserved mobile space.
  const welcomeBox = (await page.getByText("Welcome back to Neuro Bridge Africa", { exact: true }).boundingBox())!; // Locate the first line below the notification.
  expect(alertBox.y + alertBox.height).toBeLessThan(welcomeBox.y); // Prevent the API error from covering the heading.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); // Keep the warning and form within the viewport.
  await page.screenshot({ path: testInfo.outputPath("login-error-320.png"), fullPage: true }); // Retain evidence of responsive error feedback.
  await expect(page.getByLabel("Your Password")).toHaveValue("BridgeTest123!"); // Preserve input after rejection.
  await page.getByLabel("Your Password").fill("Corrected123!"); // Correct the input without reloading.
  await expect(alert).toHaveCount(0); // Clear obsolete feedback on deliberate correction.
  await expect(page.getByRole("button", { name: "Login", exact: true })).toBeEnabled(); // Restore the retry action.
  expect(attempts).toBe(1); // Never retry authentication automatically.
}); // Finish request-state coverage.
test("signin fits narrow screens and keeps recovery reachable", async ({ page }, testInfo) => { // Verify responsive behavior for the longer therapist heading.
  await openLogin(page, "?role=THERAPIST"); // Use the longest source greeting.
  for (const width of [390, 320]) { // Check normal and narrow mobile widths.
    await page.setViewportSize({ width, height: 844 }); // Keep the viewport height stable between checks.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); // Reject horizontal overflow from text or control widths.
    await expect(page.getByRole("link", { name: "Forgot Password?" })).toBeVisible(); // Keep account recovery discoverable on mobile.
    await page.screenshot({ path: testInfo.outputPath(`login-${width}.png`), fullPage: true }); // Save evidence of mobile typography and spacing.
  } // Finish responsive checks.
  await page.getByRole("link", { name: "Forgot Password?" }).click(); // Verify the recovery link is functional, not just styled.
  await expect(page).toHaveURL(/\/forgot-password$/); // Preserve the established password recovery route.
}); // Finish mobile coverage.
