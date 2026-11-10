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
type RunnableStory = {
  run: (context: { canvasElement: HTMLElement }) => Promise<void>;
  parameters?: { visual?: { capture?: string } };
};
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
            // Let opening transitions, such as a dialog's, finish first.
            await Promise.all(document.getAnimations().map((animation) => animation.finished));
            const slug = `${title}--${name}--${theme}--${density}`
              .toLowerCase()
              .replace(/[^a-z0-9-]+/g, "-");
            // Stories whose content paints in the top layer, such as modal
            // dialogs, name the element to capture instead of their canvas.
            const selector = Story.parameters?.["visual"]?.capture;
            const capture = selector ? document.querySelector(selector) : canvasElement;
            if (!capture) {
              throw new Error(`${name} has no element matching ${selector}`);
            }
            await expect.element(page.elementLocator(capture)).toMatchScreenshot(slug);
          });
        }
      }
    }
  });
}
