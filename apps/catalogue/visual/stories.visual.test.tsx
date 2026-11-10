import * as a11yAnnotations from "@storybook/addon-a11y/preview";
import { composeStories, setProjectAnnotations } from "@storybook/react-vite";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import * as previewAnnotations from "../.storybook/preview.js";
import { visualThemes } from "../src/themes/choices.js";

/**
 * Visual regression (ADR 0006, ADR 0022): every story in three themes and
 * both densities, compared pixel for pixel with the committed baselines.
 * Each render is also checked with axe, so contrast holds in every theme,
 * not just the default one.
 */
setProjectAnnotations([a11yAnnotations, previewAnnotations]);

type StoryModule = Parameters<typeof composeStories>[0];
/** What the test needs from a composed story. */
type RunnableStory = { run: (context: { canvasElement: HTMLElement }) => Promise<void> };
const modules = import.meta.glob<StoryModule>("../src/**/*.stories.tsx", { eager: true });
const DENSITIES = ["comfortable", "compact"] as const;

const mounted: HTMLElement[] = [];
afterEach(() => {
  for (const element of mounted.splice(0)) {
    element.remove();
  }
});

for (const [path, module] of Object.entries(modules)) {
  const title = (module.default as { title?: string }).title ?? path;
  describe(title, () => {
    for (const theme of visualThemes) {
      for (const density of DENSITIES) {
        const stories = composeStories(module, { initialGlobals: { theme, density } });
        for (const [name, Story] of Object.entries(stories) as [string, RunnableStory][]) {
          it(`${name} in ${theme}, ${density}`, async () => {
            const canvasElement = document.createElement("div");
            document.body.append(canvasElement);
            mounted.push(canvasElement);
            await Story.run({ canvasElement });
            await document.fonts.ready;
            const slug = `${title}--${name}--${theme}--${density}`
              .toLowerCase()
              .replace(/[^a-z0-9-]+/g, "-");
            await expect.element(page.elementLocator(canvasElement)).toMatchScreenshot(slug);
          });
        }
      }
    }
  });
}
