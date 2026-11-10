import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import type { BrowserCommand } from "vitest/node";

/**
 * Emulates `prefers-color-scheme`, so browser tests can check system mode.
 * Declared for tests in src/test/browser-commands.d.ts.
 */
const setColorScheme: BrowserCommand<[scheme: "light" | "dark"]> = async (context, scheme) => {
  if (context.provider.name !== "playwright") {
    throw new Error("setColorScheme needs the Playwright provider");
  }
  await context.page.emulateMedia({ colorScheme: scheme });
};

const ALL_BROWSERS = ["chromium", "firefox", "webkit"] as const;

// Browser tests run on Chromium locally, and on all three engines in CI or
// with --mode all-browsers (ADR 0015).
export default defineConfig(({ mode }) => {
  const browsers =
    process.env["CI"] || mode === "all-browsers" ? ALL_BROWSERS : (["chromium"] as const);
  return {
    test: {
      projects: [
        {
          test: {
            name: "unit",
            // build.test.ts checks the built package, so it sits next to the
            // Vite config rather than in src/.
            include: ["src/**/*.test.{ts,tsx}", "*.test.ts"],
            exclude: ["src/**/*.browser.test.{ts,tsx}"],
            environment: "node",
          },
        },
        {
          test: {
            name: "browser",
            include: ["src/**/*.browser.test.{ts,tsx}"],
            browser: {
              enabled: true,
              headless: true,
              provider: playwright(),
              instances: browsers.map((browser) => ({ browser })),
              commands: { setColorScheme },
            },
          },
        },
      ],
    },
  };
});
