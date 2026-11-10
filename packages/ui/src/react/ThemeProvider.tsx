import type { ReactElement, ReactNode } from "react";
import { useId } from "react";
import { UiError } from "../errors/ui-error.js";
import { isThemePair } from "../theme/pair.js";
import { cssWriterOf } from "../theme/registry.js";
import type { ColorMode, Density, Theme, ThemePair } from "../theme/types.js";

/**
 * Props of {@link ThemeProvider} shared by every form.
 *
 * @public
 */
export interface ThemeProviderBaseProps {
  /** Density of everything inside. Inherited from above when omitted. */
  readonly density?: Density;
  /**
   * The nonce of a Content Security Policy whose `style-src` allows it.
   * Only needed with a custom theme, which renders a `<style>` element.
   */
  readonly nonce?: string;
  readonly children?: ReactNode;
}

/**
 * The built-in themes, or a custom light and dark pair, with a colour mode.
 *
 * @public
 */
export interface ThemeProviderModeProps extends ThemeProviderBaseProps {
  /** A custom `{ light, dark }` pair. The built-in themes when omitted. */
  readonly theme?: ThemePair;
  /** Light, dark, or follow the operating system. Defaults to `"system"`. */
  readonly mode?: ColorMode;
}

/**
 * A single custom theme, which has one colour scheme, so there's no mode.
 *
 * @public
 */
export interface ThemeProviderSingleProps extends ThemeProviderBaseProps {
  readonly theme: Theme;
  readonly mode?: undefined;
}

/**
 * Props of {@link ThemeProvider}.
 *
 * @public
 */
export type ThemeProviderProps = ThemeProviderModeProps | ThemeProviderSingleProps;

/** Generated CSS by theme, then by selector. Themes are frozen, so this can't go stale. */
const cssCache = new WeakMap<Theme | ThemePair, Map<string, string>>();

function cachedCss(theme: Theme | ThemePair, selector: string): string {
  let bySelector = cssCache.get(theme);
  if (!bySelector) {
    bySelector = new Map();
    cssCache.set(theme, bySelector);
  }
  let css = bySelector.get(selector);
  if (css === undefined) {
    // Themes from createTheme carry their CSS writer, so this component never
    // imports the validator: applications using only the built-in themes
    // don't ship it.
    const [light, dark] = isThemePair(theme) ? [theme.light, theme.dark] : [theme, undefined];
    const write = cssWriterOf(light);
    if (!write || (dark !== undefined && !cssWriterOf(dark))) {
      throw new UiError("INVALID_THEME_TOKEN", "ThemeProvider takes themes from createTheme.", {
        details: { token: "theme", value: "", reason: "pass themes created with createTheme" },
      });
    }
    css = write(light, dark, selector);
    bySelector.set(selector, css);
  }
  return css;
}

/**
 * Applies a theme, colour mode and density to everything inside it, with CSS
 * custom properties only: no runtime styling library and no context reads in
 * components (ADR 0006).
 *
 * It renders a wrapper with `display: contents`, so it doesn't affect layout.
 * A custom theme is written as a `<style>` element, rendered on the server
 * with the rest of the page, and `system` mode is pure CSS, so nothing
 * flashes before hydration (ADR 0007). Pass a stable theme object, such as
 * one created at module level, so its CSS is generated once.
 *
 * Under a Content Security Policy, a custom theme needs a `style-src` nonce
 * source and the `nonce` prop. Without a nonce, use `themeToCss` at build
 * time instead. The built-in themes need no inline styles.
 *
 * @example
 * ```tsx
 * <ThemeProvider theme={{ light: brandLight, dark: brandDark }} mode="system" density="compact">
 *   <App />
 * </ThemeProvider>
 * ```
 *
 * @public
 */
export function ThemeProvider(props: ThemeProviderProps): ReactElement {
  const { theme, mode, density, nonce, children } = props;
  // useId keeps server and client markup identical. Its characters vary
  // between React versions, so only selector-safe ones are kept.
  const scopeId = `hm${useId().replace(/[^A-Za-z0-9_-]/g, "-")}`;
  const single = theme !== undefined && !isThemePair(theme);
  const css =
    theme === undefined ? undefined : cachedCss(theme, `[data-hm-theme-scope="${scopeId}"]`);
  return (
    <div
      data-hm-theme-scope={scopeId}
      data-hm-theme={single ? undefined : (mode ?? "system")}
      data-hm-density={density}
    >
      {css === undefined ? null : (
        <style
          nonce={nonce}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: the CSS comes from themeToCss, which allowlists every value and selector and never emits "<".
          dangerouslySetInnerHTML={{ __html: css }}
        />
      )}
      {children}
    </div>
  );
}
