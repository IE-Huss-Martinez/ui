import { describe, expect, it } from "vitest";
import { CssValueError, parseValue, validateValue } from "./css-value.js";

describe("parseValue", () => {
  it.each([
    ["#3b82f6", "#3b82f6"],
    ["oklch(0.6 0.2 258)", "oklch(0.6 0.2 258)"],
    ["rgb(0 0 0 / 50%)", "rgb(0 0 0 / 50%)"],
    ["rgba(0, 0, 0, 0.5)", "rgba(0, 0, 0, 0.5)"],
    ["  var(--hm-blue-600)  ", "var(--hm-blue-600)"],
    ["var(--hm-x, #fff)", "var(--hm-x, #fff)"],
    ["calc(var(--hm-space-2) * 2)", "calc(var(--hm-space-2) * 2)"],
    ["calc(1rem - 2px)", "calc(1rem - 2px)"],
    ['"Inter", system-ui, sans-serif', '"Inter", system-ui, sans-serif'],
    ["color-mix(in oklch, #000 20%, #fff)", "color-mix(in oklch, #000 20%, #fff)"],
  ])("accepts %j", (input, css) => {
    expect(parseValue(input).css).toBe(css);
  });

  // Each of these tries to end the declaration, the rule, the @scope block or
  // the <style> element, or to load something from the network.
  it.each([
    ["a declaration break", "red; background: url(https://evil.example/x)"],
    ["a rule break", "red } body { display: none"],
    ["an opening brace", "red { color: blue"],
    ["the end of the style element", "red</style><script>alert(1)</script>"],
    ["an HTML tag", "<img src=x onerror=alert(1)>"],
    ["url()", "url(https://evil.example/track.png)"],
    ["url() inside a function", "image-set(url(x.png) 1x)"],
    ["@import", '@import "https://evil.example/x.css"'],
    ["a comment", "red /* } */"],
    ["a comment opener", "red /*"],
    ["an escape", "\\7d"],
    ["!important", "red !important"],
    ["an unbalanced parenthesis", "rgb(0 0 0"],
    ["an extra closing parenthesis", "rgb(0 0 0))"],
    ["an unterminated string", '"Inter'],
    ["a quote inside a string", '"a\\"b"'],
    ["markup inside a string", '"</style>"'],
    ["a function outside the allowlist", "expression(alert(1))"],
    ["attr()", "attr(data-x)"],
    ["env()", "env(safe-area-inset-top)"],
    ["a foreign custom property", "var(--evil)"],
    ["var() without a property", "var(red)"],
    ["a newline with a brace", "red\n}"],
    ["deep nesting", `${"calc(".repeat(10)}1px${")".repeat(10)}`],
    ["a very long value", `${"a".repeat(1001)}`],
    ["an empty value", "   "],
  ])("rejects %s", (_name, input) => {
    expect(() => parseValue(input)).toThrow(CssValueError);
  });

  it("rejects values that aren't strings", () => {
    expect(() => parseValue(42 as unknown as string)).toThrow(CssValueError);
  });
});

describe("validateValue", () => {
  it.each([
    ["color", "#fff"],
    ["color", "transparent"],
    ["color", "var(--hm-blue-500)"],
    ["length", "0"],
    ["length", "1.5rem"],
    ["length", "clamp(1rem, 2cqi, 2rem)"],
    ["duration", "120ms"],
    ["easing", "cubic-bezier(0.2, 0, 0, 1)"],
    ["easing", "ease-out"],
    ["number", "1.5"],
    ["integer", "10"],
    ["font-weight", "600"],
    ["font-family", "ui-monospace, Menlo, monospace"],
    ["shadow", "0 1px 2px oklch(0 0 0 / 0.1), inset 0 0 0 1px #000"],
    ["shadow", "none"],
    ["outline", "2px solid var(--hm-focus-ring-color)"],
    ["color-scheme", "dark"],
  ] as const)("accepts a %s value: %j", (type, value) => {
    expect(() => validateValue(value, type)).not.toThrow();
  });

  it.each([
    ["color", "16px"],
    ["color", "banana"],
    ["length", "12"],
    ["length", "100ms"],
    ["duration", "1rem"],
    ["easing", "fast"],
    ["integer", "1.5"],
    ["font-weight", "1200"],
    ["font-family", "12px"],
    ["shadow", "red"],
    ["outline", "2px solid red blue extra"],
    ["color-scheme", "dim"],
  ] as const)("rejects a %s value: %j", (type, value) => {
    expect(() => validateValue(value, type)).toThrow(CssValueError);
  });
});
