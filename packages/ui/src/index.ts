/**
 * Design tokens, themes and theme helpers for the `@hussmartinez` SDK family.
 *
 * @remarks
 * This entry is server-safe: it has no React and touches no DOM on import, so
 * Server Components and build scripts can import it (ADR 0004, ADR 0007).
 *
 * @packageDocumentation
 */

export type { UiErrorCode } from "./errors/ui-error.js";
export { UiError } from "./errors/ui-error.js";
export { uiMessages } from "./messages/en.js";
export type { ContrastReport } from "./theme/contrast-check.js";
export { checkContrast } from "./theme/contrast-check.js";
export { createTheme, darkTheme, lightTheme } from "./theme/create-theme.js";
export { themeToCss } from "./theme/theme-to-css.js";
export type {
  ColorMode,
  CompleteThemeInput,
  CompleteThemeTokens,
  ComponentTokens,
  Density,
  DensityTokens,
  ExtendingThemeInput,
  Theme,
  ThemeInput,
  ThemeInputBase,
  ThemePair,
  ThemeTokens,
} from "./theme/types.js";
export type { ContrastPair } from "./tokens/contrast.js";
export { contrastPairs } from "./tokens/contrast.js";
export type {
  BaseTokenName,
  DensityTokenName,
  SemanticTokenName,
  TokenCategory,
  TokenDefinition,
  TokenLevel,
  TokenName,
  TokenType,
} from "./tokens/definitions.js";
export { tokens } from "./tokens/definitions.js";
