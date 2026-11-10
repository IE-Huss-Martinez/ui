import { createTheme, type ThemePair } from "@hussmartinez/ui";

/**
 * Poster: a deliberately unusual demo theme, used only in the catalogue and
 * the visual tests (ADR 0006). Square corners, a monospace face, a strong
 * vermilion accent, thick black borders and hard offset shadows. If a
 * component hard-codes a value instead of using a token, it looks wrong here
 * straight away.
 */
const shared = {
  "font-family": "var(--hm-font-mono)",
  "letter-spacing": "0.02em",
  "font-weight-strong": "var(--hm-font-weight-700)",
  "radius-control": "0",
  "radius-surface": "0",
  "radius-round": "0",
  "border-width": "var(--hm-border-width-2)",
  "focus-ring-width": "3px",
  "focus-ring-offset": "3px",
  "motion-duration-feedback": "60ms",
  "motion-duration-enter": "120ms",
  "motion-duration-exit": "80ms",
  "motion-easing-standard": "steps(4, end)",
  "motion-easing-enter": "steps(4, end)",
  "motion-easing-exit": "steps(4, end)",
} as const;

const light = createTheme({
  extends: "light",
  tokens: {
    ...shared,
    "color-bg": "#fff8e7",
    "color-surface": "#fff1cc",
    "color-surface-raised": "#ffffff",
    "color-surface-sunken": "#f5e6bf",
    "color-text": "#111111",
    "color-text-muted": "#4a4033",
    "color-border": "#111111",
    "color-border-strong": "#111111",
    "color-control": "#ffffff",
    "color-control-hover": "#ffe9a8",
    "color-control-active": "#ffd970",
    "color-accent": "#c2260c",
    "color-accent-hover": "#a11f0a",
    "color-accent-active": "#7f1807",
    "color-on-accent": "#ffffff",
    "color-accent-subtle": "#ffd9cc",
    "color-accent-text": "#a11f0a",
    "focus-ring-color": "#111111",
    "shadow-raised": "4px 4px 0 #111111",
    "shadow-overlay": "8px 8px 0 #111111",
  },
});

const dark = createTheme({
  extends: "dark",
  tokens: {
    ...shared,
    "color-bg": "#111111",
    "color-surface": "#1c1a17",
    "color-surface-raised": "#26231f",
    "color-surface-sunken": "#000000",
    "color-text": "#fff8e7",
    "color-text-muted": "#d9cdb4",
    "color-border": "#fff8e7",
    "color-border-strong": "#fff8e7",
    "color-control": "#26231f",
    "color-control-hover": "#3a342c",
    "color-control-active": "#4d4539",
    "color-accent": "#ff7a52",
    "color-accent-hover": "#ff9a7a",
    "color-accent-active": "#ffb8a1",
    "color-on-accent": "#111111",
    "color-accent-subtle": "#4a1c10",
    "color-accent-text": "#ff9a7a",
    "focus-ring-color": "#fff8e7",
    "shadow-raised": "4px 4px 0 #fff8e7",
    "shadow-overlay": "8px 8px 0 #fff8e7",
  },
});

/** The Poster theme's light and dark variants. */
export const poster: ThemePair = { light, dark };
