import { UiError } from "../errors/ui-error.js";
import { densityTokenNames, tokens } from "../tokens/definitions.js";
import type { Theme } from "./types.js";

/**
 * Writes validated themes as CSS: the rules shared by the built-in token CSS,
 * `themeToCss` and `ThemeProvider`. Nothing here validates token values;
 * callers pass themes from `createTheme`.
 */

const DENSITY_TOKENS = /* @__PURE__ */ new Set<string>(densityTokenNames);
const TOKEN_ORDER = /* @__PURE__ */ tokenOrder();

function tokenOrder(): ReadonlyMap<string, number> {
  return new Map(tokens.map((definition, index) => [definition.name, index]));
}

const MAX_SELECTOR_LENGTH = 500;

/** The layer statements of styles.css (ADR 0005, docs/adr/0001). */
export const LAYER_ORDER =
  "@layer hm.tokens, hm.base, hm.components, hm.sdk;\n@layer hm.tokens.default, hm.tokens.theme;";
/**
 * Characters a selector may contain. Everything that could end the `@scope`
 * prelude or the stylesheet is missing: `{ } ; @ \ < /` and so comments too.
 */
const SELECTOR_CHARACTERS = /^[A-Za-z0-9\s_\-.#:[\]="'()*>+~,|^$]+$/;

function invalidSelector(selector: string, reason: string): UiError {
  return new UiError(
    "INVALID_THEME_SELECTOR",
    `The selector "${selector.slice(0, 200)}" can't be used: ${reason}.`,
    { details: { selector: selector.slice(0, 200), reason } },
  );
}

/**
 * Checks that a selector is a plain selector list, and returns it with
 * normalised whitespace. Throws a {@link UiError} with the code
 * `INVALID_THEME_SELECTOR` otherwise.
 */
export function validateSelector(selector: unknown): string {
  if (typeof selector !== "string") {
    throw invalidSelector(String(selector), "selectors must be strings");
  }
  const trimmed = selector.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0 || trimmed.length > MAX_SELECTOR_LENGTH) {
    throw invalidSelector(selector, `selectors must have 1 to ${MAX_SELECTOR_LENGTH} characters`);
  }
  if (!SELECTOR_CHARACTERS.test(trimmed)) {
    throw invalidSelector(selector, "it contains a character that isn't allowed");
  }
  const stack: string[] = [];
  let quote: string | undefined;
  for (const char of trimmed) {
    if (quote) {
      if (char === quote) {
        quote = undefined;
      } else if (!/[A-Za-z0-9 _.:-]/.test(char)) {
        throw invalidSelector(
          selector,
          "quoted values may only contain letters, digits, spaces, _ . : and -",
        );
      }
      continue;
    }
    if (char === '"' || char === "'") {
      if (stack.at(-1) !== "[") {
        throw invalidSelector(selector, "quotes are only allowed in attribute selectors");
      }
      quote = char;
    } else if (char === "(" || char === "[") {
      stack.push(char);
    } else if (char === ")" || char === "]") {
      if (stack.pop() !== (char === ")" ? "(" : "[")) {
        throw invalidSelector(selector, "brackets aren't balanced");
      }
    }
  }
  if (quote || stack.length > 0) {
    throw invalidSelector(selector, "brackets or quotes aren't balanced");
  }
  return trimmed;
}

function byTokenOrder(a: string, b: string): number {
  const left = TOKEN_ORDER.get(a) ?? Number.MAX_SAFE_INTEGER;
  const right = TOKEN_ORDER.get(b) ?? Number.MAX_SAFE_INTEGER;
  return left - right || (a < b ? -1 : a > b ? 1 : 0);
}

/** One CSS rule: selectors and declarations, before indentation. */
export interface CssBlock {
  readonly selectors: readonly string[];
  readonly values: Readonly<Record<string, string>>;
  /** A condition the rule sits in, such as `(prefers-color-scheme: dark)`. */
  readonly media?: string;
}

/** Biome's line width; generated CSS is formatted the way Biome would format it. */
const LINE_WIDTH = 100;

function declaration(indent: string, name: string, value: string): string {
  const line = `${indent}--hm-${name}: ${value};`;
  return line.length <= LINE_WIDTH ? line : `${indent}--hm-${name}:\n${indent}  ${value};`;
}

/** Writes rules with deterministic order and indentation. */
export function renderBlocks(blocks: readonly CssBlock[], indent: string): string {
  return blocks
    .filter((block) => Object.keys(block.values).length > 0)
    .map((block) => {
      const inner = block.media ? `${indent}  ` : indent;
      const declarations = Object.keys(block.values)
        .sort(byTokenOrder)
        .map((name) => declaration(`${inner}  `, name, block.values[name] as string))
        .join("\n");
      const rule = `${inner}${block.selectors.join(`,\n${inner}`)} {\n${declarations}\n${inner}}`;
      return block.media ? `${indent}@media ${block.media} {\n${rule}\n${indent}}` : rule;
    })
    .join("\n\n");
}

/** Splits a theme's tokens into the colour-mode part and the density part. */
export function splitTokens(values: Readonly<Record<string, string>>): {
  scheme: Record<string, string>;
  density: Record<string, string>;
} {
  const scheme: Record<string, string> = {};
  const density: Record<string, string> = {};
  for (const [name, value] of Object.entries(values)) {
    (DENSITY_TOKENS.has(name) ? density : scheme)[name] = value;
  }
  return { scheme, density };
}

/**
 * Selectors for a theme applied at a root (`:root` for the built-in themes,
 * `:scope` inside `@scope` for custom ones), so the same rules serve both.
 */
export function themeBlocks(root: string, light: Theme, dark: Theme | undefined): CssBlock[] {
  const lightTokens = splitTokens(light.tokens);
  const density: CssBlock[] = [
    { selectors: [root, '[data-hm-density="comfortable"]'], values: lightTokens.density },
    {
      selectors: [`${root}[data-hm-density="compact"]`, '[data-hm-density="compact"]'],
      values: light.compact,
    },
    {
      media: "(pointer: coarse)",
      selectors: [root, `${root}[data-hm-density]`, "[data-hm-density]"],
      values: light.coarsePointer,
    },
  ];
  if (!dark) {
    return [{ selectors: [root], values: lightTokens.scheme }, ...density];
  }
  const darkTokens = splitTokens(dark.tokens).scheme;
  return [
    {
      selectors: [root, '[data-hm-theme="light"]', '[data-hm-theme="system"]'],
      values: lightTokens.scheme,
    },
    {
      media: "(prefers-color-scheme: dark)",
      selectors: [root, '[data-hm-theme="system"]'],
      values: darkTokens,
    },
    // Repeated after the media rule, so a forced theme on the root itself
    // beats the system preference.
    {
      selectors: [`${root}[data-hm-theme="light"]`, '[data-hm-theme="light"]'],
      values: lightTokens.scheme,
    },
    {
      selectors: [`${root}[data-hm-theme="dark"]`, '[data-hm-theme="dark"]'],
      values: darkTokens,
    },
    ...density,
  ];
}

/**
 * Writes validated themes as a stylesheet scoped to `selector`. The selector
 * is validated here; the themes must come from `createTheme`.
 */
export function writeThemeCss(light: Theme, dark: Theme | undefined, selector: string): string {
  const scope = validateSelector(selector);
  const body = renderBlocks(themeBlocks(":scope", light, dark), "    ");
  // The layer order is set by the first stylesheet that names a layer. Repeating
  // it here keeps custom themes above the built-in ones even when this CSS
  // loads before styles.css.
  const css = `${LAYER_ORDER}\n\n@layer hm.tokens.theme {\n  @scope (${scope}) {\n${body}\n  }\n}\n`;
  if (css.includes("<")) {
    // Unreachable: values and selectors are allowlisted. Kept as the last
    // line of defence, because this string goes into a <style> element.
    throw new UiError("INVALID_THEME_TOKEN", "The theme produced unsafe CSS.", {
      details: { token: "theme", value: "", reason: "the CSS contains <" },
    });
  }
  return css;
}
