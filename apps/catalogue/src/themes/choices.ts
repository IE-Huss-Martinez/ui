import type { ColorMode, ThemePair } from "@hussmartinez/ui";
import { poster } from "./poster.js";

/** The theme toolbar's choices, as ThemeProvider props. */
export const themeChoices = {
  light: { mode: "light" },
  dark: { mode: "dark" },
  system: { mode: "system" },
  "poster-light": { theme: poster, mode: "light" },
  "poster-dark": { theme: poster, mode: "dark" },
} as const satisfies Record<string, { theme?: ThemePair; mode: ColorMode }>;

export type ThemeChoice = keyof typeof themeChoices;

/** The themes visual tests render every story in (ADR 0006). */
export const visualThemes: readonly ThemeChoice[] = ["light", "dark", "poster-light"];
