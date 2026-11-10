import type { Theme } from "./types.js";

/** Writes validated themes as CSS. Lives in css-writer.ts. */
export type CssWriter = (light: Theme, dark: Theme | undefined, selector: string) => string;

/**
 * Themes from `createTheme`, with the function that writes them as CSS.
 *
 * Kept apart from `createTheme` so `ThemeProvider` can apply themes without
 * importing the validator, the colour parser or the token data: an
 * application that only uses the built-in themes doesn't ship them.
 */
const writers = /* @__PURE__ */ new WeakMap<Theme, CssWriter>();

/** Records a validated theme, and how to write it as CSS. */
export function registerTheme(theme: Theme, writer: CssWriter): void {
  writers.set(theme, writer);
}

/**
 * The CSS writer of a theme from `createTheme`, or `undefined` for anything
 * else, such as a theme parsed from JSON.
 */
export function cssWriterOf(theme: unknown): CssWriter | undefined {
  return typeof theme === "object" && theme !== null ? writers.get(theme as Theme) : undefined;
}
