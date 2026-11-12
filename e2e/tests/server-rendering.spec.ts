import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

/**
 * The same checks against both examples: the package renders on the server,
 * hydrates without a warning, works afterwards, passes axe and never reaches
 * another origin (ADR 0007, ADR 0012, ADR 0014).
 */
const apps = [
  { name: "Next.js App Router", url: "http://localhost:3100/" },
  { name: "Vite", url: "http://localhost:3200/" },
] as const;

interface Problems {
  console: string[];
  errors: string[];
  foreignRequests: string[];
}

function watch(page: Page, origin: string): Problems {
  const problems: Problems = { console: [], errors: [], foreignRequests: [] };
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      problems.console.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => problems.errors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith("http") && url.origin !== origin) {
      problems.foreignRequests.push(request.url());
    }
  });
  return problems;
}

for (const app of apps) {
  test.describe(app.name, () => {
    test("renders every component on the server", async ({ request }) => {
      const response = await request.get(app.url);
      expect(response.ok()).toBe(true);
      const html = await response.text();
      for (const marker of [
        'data-hm-theme-scope="',
        'role="toolbar"',
        'class="hm-toolbar-group"',
        'class="hm-toolbar-separator"',
        "hm-icon-button",
        'aria-pressed="false"',
        'class="hm-spinner"',
        "<progress",
        'class="hm-visually-hidden"',
        'role="radiogroup"',
        "<dialog",
        'role="status"',
        "@layer hm.tokens.theme",
      ]) {
        expect(html, marker).toContain(marker);
      }
    });

    test("hydrates without errors or warnings, and works afterwards", async ({ page }) => {
      const problems = watch(page, new URL(app.url).origin);
      await page.goto(app.url);
      await expect(page.locator("[data-hydrated]")).toBeAttached();

      // The toolbar has exactly one Tab stop after hydration.
      await expect(page.locator('[role="toolbar"] [tabindex="0"]')).toHaveCount(1);

      // A toggle button keeps its own state, even from a Server Component.
      const loop = page.getByRole("button", { name: "Loop" });
      await loop.click();
      await expect(loop).toHaveAttribute("aria-pressed", "true");

      // The segmented control selects with the arrow keys.
      await page.getByRole("radio", { name: "Single" }).focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("radio", { name: "Grid" })).toHaveAttribute(
        "aria-checked",
        "true",
      );

      // The dialog opens as a modal, and Escape closes it.
      await page.getByRole("button", { name: "Open dialog" }).click();
      const dialog = page.getByRole("dialog", { name: "Export" });
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();

      // Confirming announces the result.
      await page.getByRole("button", { name: "Open dialog" }).click();
      await page.getByRole("button", { name: "Confirm" }).click();
      await expect(page.getByRole("status")).toHaveText("Exported");

      // The themed section uses the custom theme from themeToCss.
      const accent = await page
        .locator("main.brand")
        .evaluate((element) => getComputedStyle(element).getPropertyValue("--hm-color-accent"));
      expect(accent.trim()).toBe("#5b21b6");

      expect(problems.errors).toEqual([]);
      expect(problems.console).toEqual([]);
      expect(problems.foreignRequests).toEqual([]);
    });

    test("passes axe", async ({ page }) => {
      await page.goto(app.url);
      await expect(page.locator("[data-hydrated]")).toBeAttached();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}
