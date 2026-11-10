import type { DensityTokenName, SemanticTokenName, TokenName } from "../tokens/definitions.js";

/**
 * How a subtree picks between light and dark: one of them, or whichever the
 * operating system prefers (`prefers-color-scheme`).
 *
 * @public
 */
export type ColorMode = "light" | "dark" | "system";

/**
 * How tightly controls are packed. Set it with `data-hm-density` or the
 * `density` prop.
 *
 * @public
 */
export type Density = "comfortable" | "compact";

/**
 * Component tokens a theme may set, such as `button-radius`. Empty in this
 * release. SDKs add theirs through declaration merging, so their themes are
 * typed too:
 *
 * ```ts
 * declare module "@hussmartinez/ui" {
 *   interface ComponentTokens {
 *     "pdf-thumb-radius": string;
 *   }
 * }
 * ```
 *
 * @public
 */
// biome-ignore lint/suspicious/noEmptyInterface: SDKs extend it through declaration merging.
export interface ComponentTokens {}

/**
 * Token values a theme sets, by token name without the `--hm-` prefix. The
 * colour scheme isn't a token here; it's `colorScheme`.
 *
 * @public
 */
export type ThemeTokens = {
  readonly [Name in Exclude<TokenName, "color-scheme">]?: string;
} & {
  readonly [Name in keyof ComponentTokens]?: ComponentTokens[Name];
};

/**
 * Every semantic token, which a theme that doesn't extend another must set.
 *
 * @public
 */
export type CompleteThemeTokens = ThemeTokens & {
  readonly [Name in Exclude<SemanticTokenName, "color-scheme">]: string;
};

/**
 * Values for the density tokens.
 *
 * @public
 */
export type DensityTokens = { readonly [Name in DensityTokenName]?: string };

/**
 * Options of `createTheme` shared by both forms.
 *
 * @public
 */
export interface ThemeInputBase {
  /** Whether the theme is light or dark. Defaults to the extended theme's, or `"light"`. */
  readonly colorScheme?: "light" | "dark";
  /** Values for compact density. Comfortable values are the density tokens in `tokens`. */
  readonly density?: { readonly compact?: DensityTokens };
  /** Values for coarse pointers, such as touch screens. Default to 44 px targets (ADR 0014). */
  readonly coarsePointer?: DensityTokens;
}

/**
 * A theme built on another: only the tokens it changes are needed.
 *
 * @public
 */
export interface ExtendingThemeInput extends ThemeInputBase {
  /** The theme to start from: a built-in one by name, or one from `createTheme`. */
  readonly extends: Theme | "light" | "dark";
  readonly tokens?: ThemeTokens;
}

/**
 * A theme from scratch: every semantic token is needed. Base tokens are
 * optional, and fall back to the built-in ones on the page.
 *
 * @public
 */
export interface CompleteThemeInput extends ThemeInputBase {
  readonly extends?: undefined;
  readonly tokens: CompleteThemeTokens;
}

/**
 * What `createTheme` accepts.
 *
 * @public
 */
export type ThemeInput = ExtendingThemeInput | CompleteThemeInput;

/**
 * A validated theme. Create it with `createTheme`; its values are
 * frozen and safe to write into CSS.
 *
 * @public
 */
export interface Theme {
  readonly colorScheme: "light" | "dark";
  /** Every token value, by name without the `--hm-` prefix. Density tokens hold comfortable values. */
  readonly tokens: Readonly<Record<string, string>>;
  /** Density token values for compact density. */
  readonly compact: Readonly<Record<string, string>>;
  /** Density token values for coarse pointers. */
  readonly coarsePointer: Readonly<Record<string, string>>;
}

/**
 * A light and a dark theme used together, so `system` mode can follow the
 * operating system. Density values come from `light`.
 *
 * @public
 */
export interface ThemePair {
  readonly light: Theme;
  readonly dark: Theme;
}
