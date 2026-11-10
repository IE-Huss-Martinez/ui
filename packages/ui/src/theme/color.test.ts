import { describe, expect, it } from "vitest";
import { contrastRatio, type Rgba, resolveColor } from "./color.js";

const none = (): undefined => undefined;
const resolve = (value: string): Rgba | undefined => resolveColor(value, none);

describe("resolveColor", () => {
  it.each([
    ["#fff", { r: 1, g: 1, b: 1, alpha: 1 }],
    ["#000000", { r: 0, g: 0, b: 0, alpha: 1 }],
    ["#ff000080", { r: 1, g: 0, b: 0, alpha: 128 / 255 }],
    ["rgb(255 0 0)", { r: 1, g: 0, b: 0, alpha: 1 }],
    ["rgba(0, 0, 255, 0.5)", { r: 0, g: 0, b: 1, alpha: 0.5 }],
    ["hsl(120 100% 50%)", { r: 0, g: 1, b: 0, alpha: 1 }],
    ["oklch(1 0 0)", { r: 1, g: 1, b: 1, alpha: 1 }],
    ["oklch(0 0 0 / 0.5)", { r: 0, g: 0, b: 0, alpha: 0.5 }],
  ])("reads %s", (value, expected) => {
    const color = resolve(value);
    expect(color?.r).toBeCloseTo(expected.r, 3);
    expect(color?.g).toBeCloseTo(expected.g, 3);
    expect(color?.b).toBeCloseTo(expected.b, 3);
    expect(color?.alpha).toBeCloseTo(expected.alpha, 3);
  });

  it("matches CSS's reference conversion for an OKLCH colour", () => {
    // oklch(0.628 0.2577 29.23) is sRGB red, per CSS Color 4.
    const red = resolve("oklch(0.628 0.2577 29.23)");
    expect(red?.r).toBeCloseTo(1, 2);
    expect(red?.g).toBeCloseTo(0, 2);
    expect(red?.b).toBeCloseTo(0, 2);
  });

  it("follows var() references through the lookup", () => {
    const lookup = (name: string): string | undefined => ({ a: "var(--hm-b)", b: "#000" })[name];
    expect(resolveColor("var(--hm-a)", lookup)).toEqual({ r: 0, g: 0, b: 0, alpha: 1 });
  });

  it.each(["color-mix(in oklch, #000, #fff)", "var(--hm-missing)", "currentcolor"])(
    "returns undefined for %s, which needs a browser",
    (value) => {
      expect(resolve(value)).toBeUndefined();
    },
  );

  it("stops at reference cycles", () => {
    expect(resolveColor("var(--hm-a)", () => "var(--hm-a)")).toBeUndefined();
  });
});

describe("contrastRatio", () => {
  const ratio = (a: string, b: string): number | undefined =>
    contrastRatio(resolve(a) as Rgba, resolve(b) as Rgba);

  it("is 21 for black on white and 1 for a colour on itself", () => {
    expect(ratio("#000", "#fff")).toBeCloseTo(21, 5);
    expect(ratio("#777", "#777")).toBeCloseTo(1, 5);
  });

  it("matches WCAG's published ratio for #767676 on white", () => {
    expect(ratio("#767676", "#fff")).toBeCloseTo(4.54, 2);
  });

  it("composites a translucent foreground over the background", () => {
    expect(ratio("rgb(0 0 0 / 0)", "#fff")).toBeCloseTo(1, 5);
    expect(ratio("rgb(0 0 0 / 0.5)", "#fff")).toBeCloseTo(ratio("#808080", "#fff") as number, 1);
  });

  it("can't check a translucent background", () => {
    expect(ratio("#000", "rgb(255 255 255 / 0.5)")).toBeUndefined();
  });
});
