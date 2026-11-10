import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { addStyle, cleanUp, loadStyles, mount, token } from "../test/dom.js";
import { baseValues } from "../tokens/base.js";
import { resolveColor } from "./color.js";
import { createTheme, darkTheme, lightTheme } from "./create-theme.js";
import { themeToCss } from "./theme-to-css.js";

// Computed custom properties have their var() references substituted.
const LIGHT_BG = baseValues.white;
const DARK_BG = baseValues["gray-950"];

beforeEach(async () => {
  await commands.setColorScheme("light");
  await loadStyles();
});
afterEach(async () => {
  cleanUp();
  await commands.setColorScheme("light");
});

/** The computed value of a token after var() substitution, through a real property. */
function resolved(element: Element | null, name: string): string {
  const probe = document.createElement("span");
  probe.style.color = `var(--hm-${name})`;
  (element as Element).append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

describe("the built-in themes", () => {
  it("follow the system preference in pure CSS", async () => {
    const root = document.documentElement;
    expect(token(root, "color-scheme")).toBe("light");
    expect(token(root, "color-bg")).toBe(LIGHT_BG);
    await commands.setColorScheme("dark");
    expect(token(root, "color-scheme")).toBe("dark");
    expect(token(root, "color-bg")).toBe(DARK_BG);
  });

  it("let data-hm-theme force a subtree, and system follow the preference again inside it", async () => {
    await commands.setColorScheme("dark");
    const root = mount(
      '<div data-hm-theme="light" id="light"><div data-hm-theme="system" id="system"></div></div>',
    );
    expect(token(root.querySelector("#light"), "color-scheme")).toBe("light");
    expect(token(root.querySelector("#system"), "color-scheme")).toBe("dark");
  });

  it("let data-hm-theme on the root beat the system preference", async () => {
    await commands.setColorScheme("dark");
    document.documentElement.setAttribute("data-hm-theme", "light");
    expect(token(document.documentElement, "color-bg")).toBe(LIGHT_BG);
  });

  it("apply density by subtree, and keep it inside a nested colour mode", () => {
    const root = mount(
      '<div data-hm-density="compact" id="compact"><div data-hm-theme="dark" id="dark"></div></div>',
    );
    expect(token(document.documentElement, "control-height")).toBe("2rem");
    expect(token(root.querySelector("#compact"), "control-height")).toBe("1.75rem");
    expect(token(root.querySelector("#dark"), "control-height")).toBe("1.75rem");
    expect(token(root.querySelector("#dark"), "color-scheme")).toBe("dark");
  });
});

describe("themeToCss in the browser", () => {
  const violet = createTheme({ extends: "light", tokens: { "color-accent": "#5b21b6" } });
  const violetDark = createTheme({ extends: "dark", tokens: { "color-accent": "#c4b5fd" } });
  const teal = createTheme({ extends: "light", tokens: { "color-accent": "#0f766e" } });
  const tealDark = createTheme({ extends: "dark", tokens: { "color-accent": "#5eead4" } });

  it("beats the built-in themes even when it loads before styles.css", () => {
    addStyle(themeToCss(violet, ".brand"), "start");
    // Built-in [data-hm-theme="dark"] matches the same element, so only the
    // layer order decides which theme wins.
    const root = mount('<div class="brand" data-hm-theme="dark"></div>');
    expect(token(root.firstElementChild, "color-accent")).toBe("#5b21b6");
  });

  it("follows the system preference with a pair, inside its scope only", async () => {
    addStyle(themeToCss({ light: violet, dark: violetDark }, ".brand"));
    const root = mount('<div class="brand"><p id="inside"></p></div><p id="outside"></p>');
    const inside = root.querySelector("#inside");
    expect(token(inside, "color-accent")).toBe("#5b21b6");
    await commands.setColorScheme("dark");
    expect(token(inside, "color-accent")).toBe("#c4b5fd");
    expect(darkTheme.tokens["color-accent"]).toBe("var(--hm-blue-400)");
    expect(token(root.querySelector("#outside"), "color-accent")).toBe(baseValues["blue-400"]);
  });

  it("lets the closest theme win when themes nest, whatever their source order", () => {
    // The inner theme's rules come first in the source, so source order alone
    // would let the outer theme win. @scope proximity must win instead.
    addStyle(themeToCss({ light: teal, dark: tealDark }, ".inner"));
    addStyle(themeToCss({ light: violet, dark: violetDark }, ".outer"));
    const root = mount(
      '<div class="outer"><div class="inner"><p data-hm-theme="dark" id="target"></p></div></div>',
    );
    expect(token(root.querySelector(".inner"), "color-accent")).toBe("#0f766e");
    expect(token(root.querySelector("#target"), "color-accent")).toBe("#5eead4");
  });

  it("re-resolves semantic tokens when a theme changes a base token", () => {
    const warm = createTheme({ extends: "light", tokens: { "gray-900": "#3b2f2f" } });
    addStyle(themeToCss(warm, ".warm"));
    const root = mount('<div class="warm"></div>');
    expect(resolved(root.firstElementChild, "color-text")).toBe("rgb(59, 47, 47)");
  });

  it("gives coarse pointers no smaller targets than the theme's comfortable size", () => {
    addStyle(themeToCss(violet, ".brand"));
    const root = mount('<div class="brand"></div>');
    const coarse = matchMedia("(pointer: coarse)").matches;
    expect(token(root.firstElementChild, "target-size")).toBe(coarse ? "2.75rem" : "1.5rem");
  });
});

describe("the contrast checker", () => {
  it("converts every palette colour the way the browser renders it", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("no 2D canvas");
    }
    const lookup = (name: string): string | undefined => lightTheme.tokens[name];
    const palette = Object.keys(lightTheme.tokens).filter((name) =>
      /^(gray|blue|red|green|amber)-\d+$/.test(name),
    );
    expect(palette).toHaveLength(55);
    for (const name of palette) {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = lightTheme.tokens[name] as string;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
      const computed = resolveColor(`var(--hm-${name})`, lookup);
      expect(Math.abs((computed?.r ?? -1) * 255 - (r ?? 0)), name).toBeLessThanOrEqual(2);
      expect(Math.abs((computed?.g ?? -1) * 255 - (g ?? 0)), name).toBeLessThanOrEqual(2);
      expect(Math.abs((computed?.b ?? -1) * 255 - (b ?? 0)), name).toBeLessThanOrEqual(2);
    }
  });
});
