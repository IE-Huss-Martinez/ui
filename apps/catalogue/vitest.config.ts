import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import { uiSourceAliases } from "./ui-source.js";

const ALL_BROWSERS = ["chromium", "firefox", "webkit"] as const;

// Screenshots depend on fonts and rendering libraries, so visual tests only run
// in the pinned Playwright image, where baselines match pixel for pixel.
if (process.argv.includes("visual") && process.env["HM_VISUAL_CONTAINER"] !== "1") {
  throw new Error(
    "Visual tests run only in the pinned Playwright image. Use pnpm test:visual, or pnpm test:visual:update to update the baselines.",
  );
}

export default defineConfig(({ mode }) => {
  // Stories run on Chromium locally, and on all three engines in CI or with
  // --mode all-browsers (ADR 0015).
  const browsers =
    process.env["CI"] || mode === "all-browsers" ? ALL_BROWSERS : (["chromium"] as const);
  return {
    resolve: { alias: uiSourceAliases },
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: "unit",
            include: ["src/**/*.test.ts", "visual/**/*.test.ts", "*.test.ts"],
            environment: "node",
          },
        },
        {
          // Every story is a test: it must render, run its play function and
          // pass axe (ADR 0022).
          extends: true,
          plugins: [storybookTest({ configDir: ".storybook" })],
          test: {
            name: "storybook",
            browser: {
              enabled: true,
              headless: true,
              provider: playwright(),
              instances: browsers.map((browser) => ({ browser })),
            },
          },
        },
        {
          // Visual regression: every story in three themes and two densities,
          // on Chromium, inside the pinned Playwright image only. Run it with
          // pnpm test:visual.
          extends: true,
          // Storybook's Vitest plugin sets this for the storybook project; it
          // tells the a11y add-on to fail a story on axe violations. The
          // visual project renders stories itself, so it sets it too, and
          // visual/a11y-guard.visual.test.tsx checks that it still works.
          define: { "import.meta.env.VITEST_STORYBOOK": JSON.stringify("false") },
          test: {
            name: "visual",
            include: ["visual/**/*.visual.test.tsx"],
            browser: {
              enabled: true,
              headless: true,
              provider: playwright(),
              instances: [{ browser: "chromium" }],
              viewport: { width: 1024, height: 768 },
              expect: {
                toMatchScreenshot: {
                  comparatorName: "pixelmatch",
                  comparatorOptions: { allowedMismatchedPixelRatio: 0 },
                },
              },
            },
          },
        },
      ],
    },
  };
});
