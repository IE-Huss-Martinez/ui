import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { checkContrast } from "../theme/contrast-check.js";
import { darkTheme, lightTheme } from "../theme/create-theme.js";
import { validateValue } from "../theme/css-value.js";
import { contrastPairs } from "./contrast.js";
import { tokens, tokensByName } from "./definitions.js";
import { generateTokenFiles } from "./generate.js";

describe("the built-in themes", () => {
  it.each([
    ["light", lightTheme],
    ["dark", darkTheme],
  ] as const)(
    "%s meets WCAG 2.2 AA for every colour pair, all of them checkable",
    (_name, theme) => {
      const report = checkContrast(theme);
      expect(report.unchecked).toEqual([]);
      expect(report.failures).toEqual([]);
    },
  );

  it.each([
    ["light", lightTheme],
    ["dark", darkTheme],
  ] as const)("%s sets every token, with a value valid for its type", (_name, theme) => {
    for (const definition of tokens) {
      const value = theme.tokens[definition.name];
      expect(value, definition.name).toBeDefined();
      expect(() => validateValue(value as string, definition.type), definition.name).not.toThrow();
    }
    for (const [name, value] of [
      ...Object.entries(theme.compact),
      ...Object.entries(theme.coarsePointer),
    ]) {
      expect(tokensByName.get(name)?.density, name).toBe(true);
      expect(() => validateValue(value, tokensByName.get(name)?.type)).not.toThrow();
    }
  });

  it("keeps compact controls at least as large as the 24 px target size", () => {
    expect(lightTheme.compact["control-height"]).toBe("1.75rem");
    expect(
      lightTheme.compact["control-height-small"] ?? lightTheme.tokens["control-height-small"],
    ).toBe("1.5rem");
  });
});

describe("the token definitions", () => {
  it("name every token once", () => {
    expect(new Set(tokens.map((t) => t.name)).size).toBe(tokens.length);
  });

  it("only pair colour tokens for contrast", () => {
    for (const pair of contrastPairs) {
      expect(tokensByName.get(pair.foreground)?.type).toBe("color");
      expect(tokensByName.get(pair.background)?.type).toBe("color");
    }
  });
});

describe("the generated files", () => {
  it.each(Object.entries(generateTokenFiles()))(
    "%s is up to date; run `pnpm --filter @hussmartinez/ui tokens` if not",
    async (path, expected) => {
      const committed = await readFile(new URL(`../../${path}`, import.meta.url), "utf8");
      expect(committed).toBe(expected);
    },
  );
});
