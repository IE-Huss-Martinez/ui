import { UiError } from "../errors/ui-error.js";
import { warnInDevelopment } from "../internal/development.js";
import { baseValues } from "../tokens/base.js";
import { densityTokenNames, tokens, tokensByName } from "../tokens/definitions.js";
import {
  coarsePointerValues,
  comfortableValues,
  compactValues,
  darkValues,
  lightValues,
} from "../tokens/themes.js";
import { checkContrast } from "./contrast-check.js";
import { CssValueError, validateValue } from "./css-value.js";
import { writeThemeCss } from "./css-writer.js";
import { cssWriterOf, registerTheme } from "./registry.js";
import type { Theme, ThemeInput } from "./types.js";

declare const process: { readonly env: { readonly NODE_ENV?: string } };

/**
 * Names of component tokens, which `ui` can't list because SDKs add their
 * own: at least two lowercase words, such as `button-radius`.
 */
const COMPONENT_TOKEN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/;
const DENSITY_TOKENS = /* @__PURE__ */ new Set<string>(densityTokenNames);
const REQUIRED_TOKENS = /* @__PURE__ */ requiredTokens();

/** Semantic tokens a theme without `extends` must set. */
function requiredTokens(): string[] {
  return tokens
    .filter((definition) => definition.level === "semantic" && definition.name !== "color-scheme")
    .map((definition) => definition.name);
}

function invalidToken(token: string, value: unknown, reason: string): UiError {
  const shown = typeof value === "string" ? value.slice(0, 200) : typeof value;
  return new UiError(
    "INVALID_THEME_TOKEN",
    `The theme token "${token}" can't be used: ${reason}.`,
    { details: { token, value: shown, reason } },
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Validates a map of token values and returns the CSS written back from each.
 * `allowed` limits which names are accepted, for density maps.
 */
function validateTokens(
  input: unknown,
  where: string,
  allowed?: ReadonlySet<string>,
): Record<string, string> {
  if (input === undefined) {
    return {};
  }
  if (!isPlainObject(input)) {
    throw invalidToken(where, input, `${where} must be a plain object`);
  }
  const output: Record<string, string> = {};
  for (const [name, value] of Object.entries(input)) {
    const definition = tokensByName.get(name);
    if (name === "color-scheme") {
      throw invalidToken(name, value, "set the colour scheme with the colorScheme option");
    }
    if (allowed && !allowed.has(name)) {
      throw invalidToken(name, value, `only density tokens can be set in ${where}`);
    }
    if (!definition && !COMPONENT_TOKEN.test(name)) {
      throw invalidToken(name, value, "it isn't a token name");
    }
    if (typeof value !== "string") {
      throw invalidToken(name, value, "values must be strings");
    }
    try {
      output[name] = validateValue(value, definition?.type);
    } catch (error) {
      if (error instanceof CssValueError) {
        throw invalidToken(name, value, error.message);
      }
      throw error;
    }
  }
  return output;
}

function freeze(theme: Theme): Theme {
  Object.freeze(theme.tokens);
  Object.freeze(theme.compact);
  Object.freeze(theme.coarsePointer);
  Object.freeze(theme);
  registerTheme(theme, writeThemeCss);
  return theme;
}

/** Built-in themes are written in this repository, and checked by tests. */
function builtInTheme(colorScheme: "light" | "dark", values: Record<string, string>): Theme {
  return freeze({
    colorScheme,
    tokens: { ...baseValues, ...values, ...comfortableValues },
    compact: { ...compactValues },
    coarsePointer: { ...coarsePointerValues },
  });
}

/**
 * The built-in light theme.
 *
 * @public
 */
export const lightTheme: Theme = /* @__PURE__ */ builtInTheme("light", lightValues);

/**
 * The built-in dark theme.
 *
 * @public
 */
export const darkTheme: Theme = /* @__PURE__ */ builtInTheme("dark", darkValues);

function warnAboutContrast(theme: Theme): void {
  const { failures, unchecked } = checkContrast(theme);
  if (failures.length > 0) {
    const list = failures
      .map((f) => `${f.foreground} on ${f.background}: ${f.ratio}:1, needs ${f.minimum}:1`)
      .join("; ");
    if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
      warnInDevelopment(`This theme is below WCAG 2.2 AA contrast. ${list}.`);
    }
  }
  if (unchecked.length > 0) {
    const list = unchecked.map((u) => `${u.foreground} on ${u.background}`).join("; ");
    if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
      warnInDevelopment(
        `These colour pairs couldn't be checked for contrast, so check them by hand: ${list}.`,
      );
    }
  }
}

function resolveParent(parent: ThemeInput["extends"]): Theme | undefined {
  if (parent === undefined) {
    return undefined;
  }
  if (parent === "light") {
    return lightTheme;
  }
  if (parent === "dark") {
    return darkTheme;
  }
  return toTheme(parent);
}

/**
 * Creates a theme: a validated, frozen set of token values that
 * {@link themeToCss} and `ThemeProvider` apply.
 *
 * - With `extends`, only the tokens that change are needed.
 * - Without it, every semantic token is needed, so a theme can replace the
 *   whole look.
 *
 * Every value is checked against its token's type and an allowlist grammar,
 * so a value can't break out of its CSS declaration, even when it comes from
 * a user. Invalid input throws a {@link UiError} with the code
 * `INVALID_THEME_TOKEN`. In development, it also warns when text, boundary or
 * focus colours fall below WCAG 2.2 AA contrast.
 *
 * @example
 * ```ts
 * const brand = createTheme({
 *   extends: "light",
 *   tokens: { "color-accent": "#6d28d9", "radius-control": "0" },
 * });
 * ```
 *
 * @public
 */
export function createTheme(input: ThemeInput): Theme {
  if (!isPlainObject(input)) {
    throw invalidToken("theme", input, "createTheme takes an options object");
  }
  const parent = resolveParent(input.extends);
  const own = validateTokens(input.tokens, "tokens");
  if (!parent) {
    const missing = REQUIRED_TOKENS.filter((name) => !(name in own));
    if (missing.length > 0) {
      throw invalidToken(
        missing[0] as string,
        undefined,
        `a theme without "extends" needs every semantic token; missing ${missing.join(", ")}`,
      );
    }
  }
  const colorScheme = input.colorScheme ?? parent?.colorScheme ?? "light";
  if (colorScheme !== "light" && colorScheme !== "dark") {
    throw invalidToken("color-scheme", colorScheme, 'colorScheme must be "light" or "dark"');
  }
  const theme = freeze({
    colorScheme,
    tokens: { ...parent?.tokens, ...own, "color-scheme": colorScheme },
    compact: {
      ...(parent?.compact ?? {}),
      ...validateTokens(input.density?.compact, "density.compact", DENSITY_TOKENS),
    },
    coarsePointer: {
      ...(parent?.coarsePointer ?? coarsePointerValues),
      ...validateTokens(input.coarsePointer, "coarsePointer", DENSITY_TOKENS),
    },
  });
  // Inline, so production bundles drop the contrast check and its colour maths.
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    warnAboutContrast(theme);
  }
  return theme;
}

/**
 * Returns a theme that's safe to write into CSS. Themes from
 * {@link createTheme} are returned as they are. Anything else, such as a
 * theme parsed from JSON, is validated again.
 */
export function toTheme(value: unknown): Theme {
  if (cssWriterOf(value)) {
    return value as Theme;
  }
  if (!isPlainObject(value) || !isPlainObject(value["tokens"])) {
    throw invalidToken("theme", value, "expected a theme from createTheme");
  }
  const scheme = value["colorScheme"];
  const { "color-scheme": _ignored, ...tokenValues } = value["tokens"];
  const compact = value["compact"];
  const coarsePointer = value["coarsePointer"];
  return createTheme({
    extends: undefined,
    colorScheme: scheme === "dark" ? "dark" : "light",
    tokens: tokenValues as never,
    ...(isPlainObject(compact) ? { density: { compact } } : {}),
    ...(isPlainObject(coarsePointer) ? { coarsePointer } : {}),
  });
}
