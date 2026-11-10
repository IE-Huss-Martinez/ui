"use client";

/**
 * Accessible React components of the `@hussmartinez` design system.
 *
 * @remarks
 * A client entry: it starts with `"use client"`, which the build keeps
 * (ADR 0007). React and React DOM 18.3 or later are optional peer
 * dependencies.
 *
 * @packageDocumentation
 */

export type {
  ThemeProviderBaseProps,
  ThemeProviderModeProps,
  ThemeProviderProps,
  ThemeProviderSingleProps,
} from "./react/ThemeProvider.js";
export { ThemeProvider } from "./react/ThemeProvider.js";
export type { ColorMode, Density, Theme, ThemePair } from "./theme/types.js";
