import { toTheme } from "./create-theme.js";
import { writeThemeCss } from "./css-writer.js";
import { isThemePair } from "./pair.js";
import type { Theme, ThemePair } from "./types.js";

/**
 * Writes a theme, or a light and dark pair, as a static stylesheet: for
 * build-time theming, server rendering without JavaScript, and strict
 * Content Security Policies.
 *
 * - **A single theme** applies to the elements `selector` matches, and
 *   everything inside them.
 * - **A pair** follows `prefers-color-scheme` in pure CSS, and descendants can
 *   force a mode with `data-hm-theme="light|dark|system"`.
 * - **Density** follows `data-hm-density`, and coarse pointers get 44 px
 *   targets.
 *
 * The rules sit in the `hm.tokens.theme` cascade layer, so they beat the
 * built-in themes whatever order stylesheets load in, and a host's unlayered
 * CSS still beats them. They're wrapped in `@scope`, so when themes are
 * nested, the closest one wins.
 *
 * Themes that didn't come from {@link createTheme} are validated again, and
 * the selector must be a plain selector list. Invalid input throws a
 * {@link UiError}. The output never contains `<`, so it's safe inside a
 * `<style>` element.
 *
 * @param theme - A theme from `createTheme`, or a `{ light, dark }` pair.
 * @param selector - Where the theme applies. Defaults to `:root`.
 *
 * @example
 * ```ts
 * // brand.css.ts, run at build time
 * export default themeToCss({ light: brandLight, dark: brandDark });
 * ```
 *
 * @public
 */
export function themeToCss(theme: Theme | ThemePair, selector = ":root"): string {
  const isPair = typeof theme === "object" && theme !== null && isThemePair(theme);
  const light = toTheme(isPair ? theme.light : theme);
  const dark = isPair ? toTheme(theme.dark) : undefined;
  return writeThemeCss(light, dark, selector);
}
