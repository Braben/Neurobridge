import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT || 3000);

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "edge",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || "msedge",
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
