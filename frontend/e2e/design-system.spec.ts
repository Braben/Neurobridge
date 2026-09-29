// Verify shared component contracts in a real browser, using the existing Playwright setup.
import { expect, test } from "@playwright/test";

// Keep every component check independent of live user data and backend availability.
test.beforeEach(async ({ page }) => {
  await page.goto("/design-system"); // The review surface is available only under next dev.
  await expect(page.locator("main[data-hydrated='true']")).toBeVisible(); // Wait until React owns the controls before screenshots alter caret styles.
  await page.evaluate(() => document.fonts.ready); // Measure the intended font after it has loaded.
});

// Geometry is a shared contract: changing it affects every form and dashboard action.
test("Figma button dimensions, typography, and disabled colors are preserved", async ({ page }) => {
  for (const [size, width] of [["sm", 158], ["md", 237], ["lg", 361]] as const) { // Use the inspected widths from nodes 35:50, 35:57, and 35:43.
    const button = page.getByTestId(`primary-${size}`); // Inspect a real instance of each size.
    await expect(button).toHaveCSS("width", `${width}px`); // Confirm width variants are not aliases.
    await expect(button).toHaveCSS("height", "60px"); // Match the Figma reference height.
    await expect(button).toHaveCSS("border-radius", "16px"); // Match the Figma reference corners.
    await expect(button).toHaveCSS("font-size", "18px"); // Catch accidental font-shorthand overrides.
    await expect(button).toHaveCSS("line-height", "28px"); // Keep button text metrics stable.
    await expect(button).toHaveCSS("font-weight", "500"); // Match the medium label weight.
  }
  await expect(page.getByTestId("primary-sm")).toHaveCSS("background-color", "rgb(10, 61, 98)"); // Match the default primary fill.
  await expect(page.getByTestId("primary-sm-disabled")).toHaveCSS("background-color", "rgb(181, 211, 238)"); // Prevent opacity-blended disabled colors.
  await expect(page.getByTestId("secondary-sm-disabled")).toHaveCSS("color", "rgb(117, 117, 117)"); // Secondary disabled text uses neutral gray.
  await page.getByTestId("primary-sm").focus(); // Exercise keyboard focus without forced preview CSS.
  await expect(page.getByTestId("primary-sm")).toHaveCSS("background-color", "rgb(0, 113, 215)"); // Match the focused component fill.
});

// Native field behavior must survive geometry and folder changes.
test("fields keep native selection, focus styling, and accessible error relationships", async ({ page }) => {
  const input = page.getByLabel("Text field - Default", { exact: true }); // Resolve the field through its label rather than a generated ID.
  await expect(input).toHaveCSS("height", "60px"); // Match the control reference height.
  await expect(input).toHaveCSS("border-radius", "16px"); // Match the field corner radius.
  await input.focus(); // Activate the real field focus state.
  await expect(input).toHaveCSS("border-color", "rgb(10, 61, 98)"); // Use the primary field border rather than the button focused color.
  const invalid = page.getByLabel("Text field - Error", { exact: true }); // Check a field with an explicit custom ID.
  await expect(invalid).toHaveAttribute("id", "invalid-email"); // Respect caller-provided IDs.
  await expect(invalid).toHaveAttribute("aria-invalid", "true"); // Expose validation state to assistive technology.
  await expect(invalid).toHaveAttribute("aria-describedby", "invalid-email-message"); // Link visible error text to its control.
  await expect(page.locator("#invalid-email-message")).toHaveText("Email address is invalid."); // Ensure the relationship points to the actual error.
  await page.getByLabel("Text field - Dropdown").selectOption("THERAPIST"); // Exercise native select keyboard/form semantics.
  await expect(page.getByLabel("Text field - Dropdown")).toHaveValue("THERAPIST"); // Confirm the selected value is retained.
  await expect(page.getByLabel("Message", { exact: true })).toHaveCSS("height", "120px"); // Match the multiline reference.
  const response = await page.request.get("/design-assets/icons/caret-down.svg"); // Verify the exact exported icon is served locally.
  expect(response.ok()).toBeTruthy(); // Reject broken asset references.
  expect(await response.text()).toContain("<svg"); // Reject an HTML error page masquerading as an icon.
});

// A disabled navigation button must not retain a usable destination.
test("unavailable commands and links cannot activate", async ({ page }) => {
  const link = page.getByRole("link", { name: "Disabled navigation" }); // Locate the disabled link by its preserved semantics.
  await expect(link).toHaveAttribute("aria-disabled", "true"); // Announce unavailability.
  await expect(link).not.toHaveAttribute("href"); // Prevent mouse, keyboard, and context-menu navigation.
  await expect(link).toHaveAttribute("tabindex", "-1"); // Remove an unavailable action from tab order.
  await expect(page.getByRole("button", { name: "Saving" })).toBeDisabled(); // Loading disables native commands.
  await expect(page.getByRole("button", { name: "Saving" })).toHaveAttribute("aria-busy", "true"); // Expose pending state without resizing the control.
  await expect(page.getByTestId("primary-sm-disabled")).toBeDisabled(); // Native disabled semantics remain intact.
  await expect(page.getByRole("link", { name: "Login", exact: true })).toHaveAttribute("href", "/login"); // Active links retain their real route.
  await page.getByTestId("primary-sm").click(); // Confirm an available action still invokes its handler.
  await expect(page.getByLabel("Action count")).toHaveText("1"); // Exactly one action should have executed.
});

// Refs and names are required for existing form libraries and recovery workflows.
test("form submission focuses invalid fields and clears feedback after correction", async ({ page }) => {
  await page.getByRole("button", { name: "Submit example" }).click(); // Trigger the local validation example.
  const email = page.getByLabel("Review Email"); // Use label association after generated IDs are applied.
  await expect(email).toBeFocused(); // Verify the forwarded ref reaches the native input.
  await expect(email).toHaveAttribute("aria-invalid", "true"); // Expose the newly reported error.
  await email.fill("review@example.com"); // Supply a corrected value through the actual control.
  await page.getByRole("button", { name: "Submit example" }).click(); // Submit native FormData through the shared button.
  await expect(page.getByRole("status").filter({ hasText: "Example submitted." })).toBeVisible(); // Observe genuine local submission feedback.
  await expect(email).not.toHaveAttribute("aria-invalid"); // Clear validation once the error is resolved.
});

// Reference geometry must not cause horizontal overflow on a narrow phone.
test("component review stays within desktop and mobile viewports", async ({ page }, testInfo) => {
  for (const width of [1440, 390, 320]) { // Check the reference desktop width and two practical phone widths.
    await page.setViewportSize({ width, height: 1000 }); // Set deterministic screenshot dimensions.
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); // Detect overflowing fixed-width controls.
    await page.screenshot({ path: testInfo.outputPath(`components-${width}.png`), fullPage: true, animations: "disabled" }); // Retain reviewable visual evidence for this run.
  }
});
