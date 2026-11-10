import { defineConfig, devices } from "@playwright/test";

const ci = Boolean(process.env["CI"]);

/**
 * End-to-end server-rendering tests (ADR 0007), against production builds of
 * the Next.js and Vite examples. Chromium locally, all three engines in CI,
 * as for the other browser tests (ADR 0015).
 */
export default defineConfig({
  testDir: "tests",
  forbidOnly: ci,
  retries: 0,
  reporter: ci ? "line" : "list",
  use: { trace: "retain-on-failure" },
  projects: (ci
    ? (["Desktop Chrome", "Desktop Firefox", "Desktop Safari"] as const)
    : (["Desktop Chrome"] as const)
  ).map((device) => ({ name: device, use: { ...devices[device] } })),
  webServer: [
    {
      command: "pnpm --filter @hussmartinez/ui-example-next start",
      url: "http://localhost:3100",
      reuseExistingServer: !ci,
      timeout: 60_000,
    },
    {
      command: "pnpm --filter @hussmartinez/ui-example-vite start",
      url: "http://localhost:3200",
      reuseExistingServer: !ci,
      timeout: 60_000,
    },
  ],
});
