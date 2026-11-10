import { isSdkError } from "@hussmartinez/sdk-core";
import { describe, expect, it } from "vitest";
import { createTheme, darkTheme, lightTheme } from "./create-theme.js";
import { validateSelector } from "./css-writer.js";
import { themeToCss } from "./theme-to-css.js";

const brand = createTheme({ extends: "light", tokens: { "color-accent": "#5b21b6" } });

describe("themeToCss", () => {
  it("writes a single theme into the theme layer, scoped to :root", () => {
    const css = themeToCss(brand);
    expect(css).toMatch(
      /^@layer hm\.tokens, hm\.base, hm\.components, hm\.sdk;\n@layer hm\.tokens\.default, hm\.tokens\.theme;\n\n@layer hm\.tokens\.theme \{\n {2}@scope \(:root\) \{\n/,
    );
    expect(css).toContain("    :scope {\n      --hm-gray-50:");
    expect(css).toContain("--hm-color-accent: #5b21b6;");
    expect(css).not.toContain("prefers-color-scheme");
  });

  it("writes a pair that follows the system and the data-hm-theme attribute", () => {
    const css = themeToCss({ light: lightTheme, dark: darkTheme }, ".app");
    expect(css).toContain("@scope (.app)");
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain(':scope[data-hm-theme="dark"],\n    [data-hm-theme="dark"] {');
    expect(css).toContain('[data-hm-theme="system"]');
  });

  it("writes density and coarse-pointer rules", () => {
    const css = themeToCss(brand);
    expect(css).toContain(':scope[data-hm-density="compact"],\n    [data-hm-density="compact"] {');
    expect(css).toContain("@media (pointer: coarse)");
    expect(css).toContain("--hm-target-size: 2.75rem;");
  });

  it("is deterministic, so server and client render the same CSS", () => {
    expect(themeToCss(brand, ".a")).toBe(themeToCss(brand, ".a"));
  });

  it("validates themes that didn't come from createTheme", () => {
    const forged = JSON.parse(JSON.stringify(lightTheme)) as { tokens: Record<string, string> };
    forged.tokens["color-accent"] = "red;}</style><script>alert(1)</script><style>";
    const error = (() => {
      try {
        themeToCss(forged as never);
      } catch (caught) {
        return caught;
      }
      return undefined;
    })();
    expect(isSdkError(error, "INVALID_THEME_TOKEN")).toBe(true);
  });

  it("never contains <", () => {
    expect(themeToCss({ light: lightTheme, dark: darkTheme })).not.toContain("<");
  });
});

describe("validateSelector", () => {
  it.each([
    [":root"],
    [".app"],
    ["#editor .panel > .hm-toolbar"],
    ['[data-hm-theme-scope="hm-r1-"]'],
    ['[data-brand^="acme"] , .x:not(.y)'],
    ["main:is(.a, .b) ~ aside + section"],
    ["  .a\n  .b  "],
  ])("accepts %j", (selector) => {
    expect(() => validateSelector(selector)).not.toThrow();
  });

  it("normalises whitespace", () => {
    expect(validateSelector("  .a\n\t.b ")).toBe(".a .b");
  });

  it.each([
    ["a rule break", ".a) { } body { color: red } @scope (.b"],
    ["a declaration break", ".a; color: red"],
    ["the end of the style element", ".a</style><script>alert(1)</script>"],
    ["an at-rule", "@import url(x)"],
    ["a comment", ".a /* x */"],
    ["an escape", ".a\\7d"],
    ["an unbalanced parenthesis", ".a:is(.b"],
    ["an unbalanced bracket", "[data-x"],
    ["a closing bracket first", ".a]["],
    ["a quote outside an attribute", ".a'b'"],
    ["an unterminated quote", '[data-x="a]'],
    ["markup in a quoted value", '[data-x="</style>"]'],
    ["a non-ASCII lookalike brace", ".a ｝"],
    ["an empty selector", "   "],
    ["a very long selector", `.${"a".repeat(600)}`],
    ["a value that isn't a string", 42],
  ])("rejects %s with INVALID_THEME_SELECTOR", (_name, selector) => {
    let error: unknown;
    try {
      validateSelector(selector);
    } catch (caught) {
      error = caught;
    }
    expect(isSdkError(error, "INVALID_THEME_SELECTOR")).toBe(true);
  });
});
