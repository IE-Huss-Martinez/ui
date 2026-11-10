import type { Theme, ThemePair } from "./types.js";

/** Whether a value is a light and dark pair rather than a single theme. */
export function isThemePair(value: Theme | ThemePair): value is ThemePair {
  return typeof value === "object" && value !== null && "light" in value && "dark" in value;
}
