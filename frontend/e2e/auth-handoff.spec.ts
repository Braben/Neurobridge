import { expect, test, type Page } from "@playwright/test"; // Cover auth routes without sending real messages or creating accounts.

const password = "BridgeTest123!"; // Use a fixture satisfying the shared password rules.
type Role = "PARENT" | "THERAPIST" | "ADMIN"; // Limit fixture roles to the backend contract.
function account(role: Role, identifier: string) { // Produce an unverified account for each handoff.
  return { id: "handoff-user", firstName: "Ama", lastName: "Mensah", email: identifier.includes("@") ? identifier : null, phone: identifier.includes("@") ? null : identifier, role, isApproved: false, avatar: null, dateOfBirth: "1990-01-01", areaofexpertise: role === "THERAPIST" ? "Speech Therapy" : null }; // Keep contact and expertise fields consistent with the selected role.
} // Complete the isolated user fixture.
async function isolate(page: Page) { // Prevent test data from reaching a real service.
  await page.route("**/api/v1/**", (route) => route.fulfill({ json: {} })); // Individual tests override only the endpoints they exercise.
  await page.route("**/socket.io/**", (route) => route.abort()); // Disable unrelated realtime traffic during auth checks.
} // Finish network isolation.

for (const scenario of [ // Exercise every signup screen and both parent contact channels.
  { role: "PARENT", identifier: "parent@example.com", url: "/register" }, // Parent email registration.
  { role: "PARENT", identifier: "+233501111111", url: "/register" }, // Parent SMS registration.
  { role: "THERAPIST", identifier: "therapist@example.com", url: "/register?role=THERAPIST" }, // Therapist-specific form and expertise payload.
  { role: "ADMIN", identifier: "admin@example.com", url: "/register/admin" }, // Invite-gated administrator form.
] as const) { // Preserve exact role types in the fixture table.
  test(`${scenario.role} signup retains its OTP target: ${scenario.identifier}`, async ({ page }) => { // Verify form, transport, and route state together.
    await isolate(page); // Keep registration and email delivery mocked.
    const channel = scenario.identifier.includes("@") ? "EMAIL" : "SMS"; // Derive the expected transport channel.
    const user = account(scenario.role, scenario.identifier); // Match the account returned by registration and session hydration.
    await page.route("**/api/v1/users/me", (route) => route.fulfill({ json: { user } })); // Preserve the pending session if the profile is hydrated.
    await page.route("**/api/v1/auth/register", async (route) => { // Inspect the real form's submitted payload.
      const payload = route.request().postDataJSON(); // Read structured request data instead of matching serialized strings.
      expect(payload).toMatchObject({ firstName: "Ama", lastName: "Mensah", role: scenario.role, password }); // Assert that the role-specific route cannot silently send another role.
      expect(payload[channel === "EMAIL" ? "email" : "phone"]).toBe(scenario.identifier); // Check normalized contact data.
      if (scenario.role === "THERAPIST") expect(payload.areaofexpertise).toBe("Speech Therapy"); // Retain the therapist's selected expertise.
      if (scenario.role === "ADMIN") expect(payload.adminInviteCode).toBe("TEST-INVITE"); // Include the admin invitation in the backend request.
      await route.fulfill({ status: 201, json: { accessToken: "handoff-token", user, requiresOtp: true, otpChannel: channel, otpIdentifier: scenario.identifier } }); // Return the same shape as the registration controller.
    }); // Finish the registration fixture.
    await page.goto(scenario.url); // Enter through the public URL rather than mounting an isolated component.
    if (scenario.role === "THERAPIST") await page.getByLabel("Full Name").fill("Ama Mensah"); // Exercise the full-name split used by the therapist screen.
    else { // Parent and admin forms have separate name fields.
      await page.getByLabel("First Name").fill("Ama"); // Supply the first name.
      await page.getByLabel("Last Name").fill("Mensah"); // Supply the surname.
    } // Finish role-specific name entry.
    if (scenario.role === "ADMIN") { // Administrators require invitation and separate contact fields.
      await page.getByLabel("Email", { exact: false }).fill(scenario.identifier); // Enter the administrator email.
      await page.getByLabel("Phone Number").fill("+233502222222"); // Supply the required administrator phone contact.
      await page.getByLabel("Admin Invite Code").fill("TEST-INVITE"); // Use a non-secret mock invitation.
    } else { // Parent and therapist forms share adult date validation and one contact field.
      await page.getByLabel("Date of Birth").fill("1990-01-01"); // Use a stable adult birth date.
      await page.getByLabel("Email or Phone Number").fill(scenario.identifier); // Test the actual email/SMS discriminator.
    } // Finish role-specific contact entry.
    if (scenario.role === "THERAPIST") await page.getByLabel("Area of Expertise").selectOption("Speech Therapy"); // Select a real option from the native control.
    await page.getByLabel("Create Your Password").fill(password); // Enter a valid password through its accessible label.
    await page.getByLabel("Confirm Your Password").fill(password); // Satisfy confirmation validation.
    await page.getByRole("button", { name: "Sign Up", exact: true }).click(); // Submit through the shared primary control.
    await expect(page).toHaveURL(/\/verify-otp$/); // Route successful signup into verification before dashboard access.
    await expect(page.getByText(scenario.identifier, { exact: true })).toBeVisible(); // Preserve the correct delivery target across route navigation.
    await expect(page.getByLabel("Email / Phone Number")).toHaveCount(0); // Do not ask the user to re-enter a known target.
    const verification = page.waitForRequest("**/api/v1/auth/verify-otp"); // Observe the payload forwarded from the saved signup state.
    await page.route("**/api/v1/auth/verify-otp", (route) => route.fulfill({ status: 400, json: { message: "Wrong OTP entered." } })); // Keep the test on the pending account flow after transport validation.
    await page.getByLabel("Verification digit 1 of 6").fill("012345"); // Include a leading zero to verify string-safe code transport.
    await page.getByRole("button", { name: "Verify OTP" }).click(); // Submit the code against the retained signup target.
    expect((await verification).postDataJSON()).toMatchObject({ identifier: scenario.identifier, channel, code: "012345" }); // Assert the complete signup-to-OTP contract.
    await expect(page.getByRole("alert").filter({ hasText: "Wrong OTP entered." })).toBeVisible(); // Confirm the rejection does not silently navigate into a workspace.
    await page.getByRole("link", { name: "Go Back" }).click(); // Leave the OTP route while retaining the pending session.
    await page.goto("/dashboard"); // Attempt protected navigation with the unverified account token.
    await expect(page).toHaveURL(/\/verify-otp$/); // Enforce the pending-verification route guard after reload.
  }); // Complete this signup scenario.
} // Finish the signup matrix.

for (const identifier of ["parent@example.com", "+233501111111"]) { // Cover signin error recovery for both contact channels.
  test(`signin recovers from rejection and hands off verification: ${identifier}`, async ({ page }) => { // Retain typed input across a failed attempt.
    await isolate(page); // Prevent real signin and OTP delivery.
    let attempts = 0; // Reject only the initial credentials request.
    const channel = identifier.includes("@") ? "EMAIL" : "SMS"; // Match the request shape chosen by the signin form.
    await page.route("**/api/v1/auth/login", async (route) => { // Exercise Redux's rejection and fulfillment paths.
      attempts += 1; // Count deliberate retries.
      expect(route.request().postDataJSON()).toEqual({ [channel === "EMAIL" ? "email" : "phone"]: identifier, password }); // Preserve the contact discriminator without sending extraneous fields.
      await route.fulfill(attempts === 1 ? { status: 401, json: { message: "Invalid credentials" } } : { json: { accessToken: "handoff-token", user: account("PARENT", identifier) } }); // Return an unverified parent after the corrected attempt.
    }); // Finish the signin fixture.
    const delivery = page.waitForRequest("**/api/v1/auth/send-otp"); // Observe the fresh-code request from signin.
    await page.route("**/api/v1/auth/send-otp", (route) => route.fulfill({ json: { message: "OTP sent" } })); // Avoid delivering a real code.
    await page.goto("/login"); // Load the migrated signin feature through its public route.
    await page.getByLabel("Email / Phone Number").fill(` ${identifier} `); // Verify surrounding whitespace is normalized.
    await page.getByLabel("Your Password").fill(password); // Use a password meeting client requirements.
    await page.getByRole("button", { name: "Login", exact: true }).click(); // Trigger the intentionally rejected attempt.
    await expect(page.getByRole("alert").filter({ hasText: "Invalid credentials" })).toBeVisible(); // Display the server's actionable error.
    await expect(page.getByLabel("Your Password")).toHaveValue(password); // Preserve user input so retry does not require retyping.
    await page.getByRole("button", { name: "Login", exact: true }).click(); // Retry after the failure without reloading.
    expect((await delivery).postDataJSON()).toEqual({ identifier, channel }); // Send the new OTP through the contact channel used for signin.
    await expect(page).toHaveURL(/\/verify-otp$/); // Require verification for the unapproved parent.
    await expect(page.getByText(identifier, { exact: true })).toBeVisible(); // Carry the trimmed target into the next screen.
    expect(attempts).toBe(2); // Record exactly one failure and one explicit retry.
  }); // Complete this signin channel scenario.
} // Finish signin coverage.
