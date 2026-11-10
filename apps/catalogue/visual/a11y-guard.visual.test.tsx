import * as a11yAnnotations from "@storybook/addon-a11y/preview";
import { composeStory, setProjectAnnotations } from "@storybook/react-vite";
import { expect, it } from "vitest";
import * as previewAnnotations from "../.storybook/preview.js";

/**
 * The visual tests rely on the a11y add-on failing a story that has axe
 * violations. That depends on Storybook internals, so this deliberately
 * inaccessible story checks it still happens.
 */
setProjectAnnotations([a11yAnnotations, previewAnnotations]);

const LowContrast = composeStory(
  {
    render: () => <p style={{ color: "#c8c8c8", background: "#ffffff" }}>Text nobody can read</p>,
  },
  { title: "Guards/Low contrast" },
);

it("fails a story with axe violations", async () => {
  const canvasElement = document.createElement("div");
  document.body.append(canvasElement);
  try {
    await expect(LowContrast.run({ canvasElement })).rejects.toThrow(/color-contrast/);
  } finally {
    canvasElement.remove();
  }
});
