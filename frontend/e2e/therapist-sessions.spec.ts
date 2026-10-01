import { expect, test, type Page } from "@playwright/test"; // Exercise real routing with isolated backend fixtures.
const therapist = { id: "notes-therapist", firstName: "Ama", lastName: "Mensah", email: "therapist@example.com", role: "THERAPIST", isApproved: true, avatar: null, areaofexpertise: "Speech Therapy" }; // Use an approved therapist without real account credentials.
const paragraph = "Today's session focused on helping your child practice sustained attention through structured activities and gentle redirection. They responded positively to visual cues and short breaks, which supported their ability to stay engaged. We also explored emotional regulation strategies, and your child was able to identify feelings with guidance. While occasional restlessness was observed, they showed progress in using coping tools to refocus. Going forward, reinforcing routines at home and encouraging consistent use of these strategies will help strengthen their progress."; // Match the reference's long-text density without shipping sample clinical data in the application.
function sessions() { return Array.from({ length: 7 }, (_, index) => ({ id: `session-${index}`, childId: `child-${index}`, therapistId: therapist.id, sessionDate: `2026-09-${String(20 - index).padStart(2, "0")}T10:00:00Z`, child: { id: `child-${index}`, firstName: index ? `Child ${index}` : "Alexandrea", lastName: "Agyemang", dateOfBirth: "2009-01-01", profileImage: index ? null : "/design-assets/child-portrait.jpg", parents: [{ parent: { id: `parent-${index}`, firstName: "Andrews", lastName: `Baah ${index}` } }] }, therapist, note: { id: `note-${index}`, goalsWorkedOn: "Managing ADHD for your child", observations: "Your child is a bit slow to grasp things explained to him that fast.", recommendations: "Take it easy on your child and keep monitoring their progress.", extraNotes: paragraph } })); } // Populate all seven measured table rows with dynamic data.
async function authenticate(page: Page, role = "THERAPIST") { // Keep all HTTP and socket activity isolated from real services.
  const user = { ...therapist, role }; // Reuse the same account shape for denied-role coverage.
  await page.route("**/socket.io/**", (route) => route.abort()); // Prevent a real websocket connection.
  await page.routeWebSocket("**/socket.io/**", () => {}); // Intercept native websocket transport too, without forwarding to a live server.
  await page.route("**/api/v1/**", (route) => { // Provide only the response contracts used by the authenticated shell.
    const path = new URL(route.request().url()).pathname; // Match endpoints structurally.
    const json = path.endsWith("/auth/login") ? { accessToken: "notes-token", user } : path.endsWith("/users/me") ? { user } : path.endsWith("/sessions") ? { sessions: sessions() } : path.endsWith("/children") ? { children: [] } : path.endsWith("/bookings") ? { bookings: [] } : path.endsWith("/resources") ? { resources: [] } : { unreadCount: 0 }; // Keep unrelated dashboard lists empty.
    return route.fulfill({ json }); // Never forward a fixture request to a real backend.
  }); // Finish network isolation.
  await page.goto(role === "THERAPIST" ? "/login?role=THERAPIST" : "/login"); // Enter through the actual role-specific signin screen.
  await page.getByLabel("Email / Phone Number").fill(user.email); // Supply the mocked account identifier.
  await page.getByLabel("Your Password").fill("BridgeTest123!"); // Use a client-valid nonsecret fixture password.
  await page.getByRole("button", { name: "Login", exact: true }).click(); // Exercise normal Redux authentication.
  await expect(page).toHaveURL(/\/dashboard$/); // Wait for the protected dashboard handoff.
} // End the authenticated setup.
test("therapist full table matches desktop dimensions and expands complete notes", async ({ page }, info) => { // Verify the reference layout alongside its real interactions.
  await page.setViewportSize({ width: 1440, height: 1024 }); // Use node 673:6411's canvas.
  await authenticate(page); // Authenticate before following the dashboard's table link.
  const runtimeErrors: string[] = []; page.on("pageerror", (error) => runtimeErrors.push(error.message)); page.on("console", (message) => { if (message.type() === "error") runtimeErrors.push(message.text()); }); // Catch invalid table nesting and hydration problems after entering this feature.
  await expect(page.locator("#session-notes").getByRole("link", { name: "See Full Table" })).toHaveAttribute("href", "/sessions"); // Prevent regression to a single child's sessions.
  await page.locator("#session-notes").getByRole("link", { name: "See Full Table" }).click(); // Test the actual dashboard-to-table route mapping.
  await expect(page.getByRole("table")).toBeVisible(); await page.evaluate(() => document.fonts.ready); // Measure only after records and fonts are rendered.
  const table = await page.getByRole("table").boundingBox(); const search = await page.getByRole("searchbox").boundingBox(); // Read actual layout geometry rather than CSS declarations.
  expect(table?.x).toBe(40); expect(table?.y).toBe(355); expect(table?.width).toBe(2080); // Preserve source origin and full content width.
  expect(search?.height).toBeLessThanOrEqual(48); expect(await page.locator("thead tr").evaluate((element) => element.getBoundingClientRect().height)).toBe(58); // Check the measured header and search control.
  expect(await page.locator("tbody tr").first().evaluate((element) => element.getBoundingClientRect().height)).toBe(56); // Keep rows stable despite long notes.
  await expect(page.getByRole("link", { name: "Add Session Notes" })).toHaveCount(0); // The full-table source has no dashboard sidebar.
  await page.locator("img:visible").evaluateAll(async (elements) => { for (const element of elements) { element.loading = "eager"; await element.decode(); } }); // Decode lazy off-screen table icons before inspecting their original files and geometry.
  const assets = await page.locator("img:visible").evaluateAll((elements) => elements.map((element) => ({ src: element.getAttribute("src"), loaded: element.complete && element.naturalWidth > 0, width: element.width, height: element.height }))); // Verify every rendered original icon and dynamic image loads.
  expect(assets.every((asset) => asset.loaded)).toBe(true); expect(assets.filter((asset) => asset.src?.includes("table-expand")).every((asset) => asset.width === 24 && asset.height === 24)).toBe(true); // Keep intrinsic SVG geometry intact.
  await page.screenshot({ path: info.outputPath("session-notes-desktop.png"), fullPage: true }); // Save a visual review artifact.
  await page.getByRole("searchbox").fill("Alexandrea"); await expect(page.locator("tbody tr")).toHaveCount(1); // Search across children without changing API scope.
  const expand = page.getByRole("button", { name: "Read extra notes for Alexandrea Agyemang" }); await expand.click(); // Reveal the off-screen column by real horizontal scrolling.
  await expect(page.getByRole("dialog")).toBeVisible(); await expect(page.getByRole("dialog")).toContainText(paragraph); // Show complete text rather than the clipped preview.
  expect((await page.getByRole("dialog").boundingBox())?.width).toBe(626); // Preserve the source expanded-note width.
  await page.screenshot({ path: info.outputPath("session-notes-expanded.png"), fullPage: true }); // Save the modal's backdrop and composition for review.
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).not.toBeVisible(); await expect(expand).toBeFocused(); // Verify dismissal and native focus restoration.
  await page.getByRole("searchbox").fill(""); await page.getByText("Sort by", { exact: true }).click(); await page.getByLabel("Oldest first").check(); // Exercise the source sorting control.
  await expect(page.locator("tbody tr").first()).toContainText("Child 6"); // Confirm real reordering rather than a decorative menu.
  expect(runtimeErrors).toEqual([]); // Require a clean rendered table, not only passing click interactions.
}); // Finish desktop reference coverage.
test("session table handles errors, empty search, and narrow screens", async ({ page }, info) => { // Keep every state usable without an oversized page canvas.
  await authenticate(page); let failed = true; // Fail only the table's first load after authentication.
  await page.route("**/api/v1/sessions", (route) => route.fulfill(failed ? { status: 503, json: { message: "Notes temporarily unavailable" } } : { json: { sessions: sessions() } })); // Isolate server rejection and retry behavior.
  await page.goto("/sessions"); await expect(page.getByRole("alert").filter({ hasText: "Notes temporarily unavailable" })).toBeVisible(); // Distinguish the request error from Next.js's route announcer.
  failed = false; await page.getByRole("button", { name: "Try again" }).click(); await expect(page.locator("tbody tr")).toHaveCount(7); // Retry the real service method.
  await page.getByRole("searchbox").fill("not-found"); await expect(page.getByRole("status")).toHaveText("No session notes match your search."); // Verify no-match feedback.
  await page.getByRole("searchbox").fill(""); // Restore the populated table before testing responsive overflow.
  for (const width of [390, 320]) { // Cover both common and narrow phone widths.
    await page.setViewportSize({ width, height: 844 }); // Keep one fixed-height phone reference.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width); // Confine horizontal overflow to the table instead of the whole page.
    await page.getByRole("button", { name: "Read observations for Alexandrea Agyemang" }).click(); // Make clipped mobile columns reachable.
    await expect(page.getByRole("dialog")).toBeVisible(); expect((await page.getByRole("dialog").boundingBox())!.width).toBeLessThanOrEqual(width - 32); // Fit the full-text view within the phone viewport.
    await page.screenshot({ path: info.outputPath(`session-notes-mobile-${width}.png`), fullPage: true }); // Capture a responsive visual artifact.
    await page.getByRole("button", { name: "Close session note" }).click(); // Restore table interaction after reading.
  } // Finish responsive coverage.
}); // Finish failure and mobile coverage.
test("parent cannot open the therapist cross-child notes route", async ({ page }) => { // Verify the client route gate in addition to backend ownership tests.
  await authenticate(page, "PARENT"); // The redirected parent dashboard may legitimately request its own scoped session collection.
  await page.goto("/sessions"); await expect(page).toHaveURL(/\/dashboard$/); // Redirect a denied role to its own workspace.
  await expect(page.getByRole("heading", { name: "Recent Session Notes - Full Table" })).toHaveCount(0); // Never render the therapist table for a parent.
  await expect(page.getByRole("table", { name: "Recent session notes", exact: true })).toHaveCount(0); // Assert denied table rendering without relying on development Strict Mode request counts.
}); // End denied-role coverage.
