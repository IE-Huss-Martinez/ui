import type { DensityTokenName, SemanticTokenName } from "./definitions.js";

/** Semantic tokens set by the colour mode: everything except density tokens. */
export type SchemeTokenName = Exclude<SemanticTokenName, DensityTokenName>;

const ref = (name: string): string => `var(--hm-${name})`;

/** Values shared by both built-in themes: type, shape, motion and stacking. */
const shared = {
  "focus-ring-width": "2px",
  "focus-ring-offset": "2px",
  "focus-ring": `${ref("focus-ring-width")} solid ${ref("focus-ring-color")}`,
  "font-family": ref("font-sans"),
  "font-family-mono": ref("font-mono"),
  "font-size-small": ref("font-size-2"),
  "font-size-body": ref("font-size-3"),
  "font-size-title": ref("font-size-6"),
  "font-weight-regular": ref("font-weight-400"),
  "font-weight-strong": ref("font-weight-600"),
  "line-height-body": ref("leading-normal"),
  "line-height-tight": ref("leading-tight"),
  "letter-spacing": "0",
  "radius-control": ref("radius-md"),
  "radius-surface": ref("radius-lg"),
  "radius-round": ref("radius-full"),
  "border-width": ref("border-width-1"),
  "motion-duration-feedback": ref("duration-fast"),
  "motion-duration-enter": ref("duration-normal"),
  "motion-duration-exit": ref("duration-fast"),
  "motion-easing-standard": ref("easing-standard"),
  "motion-easing-enter": ref("easing-decelerate"),
  "motion-easing-exit": ref("easing-accelerate"),
  "z-raised": "1",
  "z-sticky": "10",
  "z-overlay": "100",
  "opacity-disabled": "0.5",
} as const;

/** Semantic values of the built-in light theme. */
export const lightValues: Readonly<Record<SchemeTokenName, string>> = {
  ...shared,
  "color-scheme": "light",
  "color-bg": ref("white"),
  "color-surface": ref("gray-50"),
  "color-surface-raised": ref("white"),
  "color-surface-sunken": ref("gray-100"),
  "color-overlay": "oklch(0.26 0.01 260 / 0.5)",
  "color-text": ref("gray-900"),
  "color-text-muted": ref("gray-700"),
  "color-text-disabled": ref("gray-400"),
  "color-border": ref("gray-200"),
  "color-border-strong": ref("gray-600"),
  "color-control": ref("gray-100"),
  "color-control-hover": ref("gray-200"),
  "color-control-active": ref("gray-300"),
  "color-accent": ref("blue-700"),
  "color-accent-hover": ref("blue-800"),
  "color-accent-active": ref("blue-900"),
  "color-on-accent": ref("white"),
  "color-accent-subtle": ref("blue-100"),
  "color-accent-text": ref("blue-700"),
  "color-danger": ref("red-600"),
  "color-danger-hover": ref("red-700"),
  "color-on-danger": ref("white"),
  "color-danger-subtle": ref("red-100"),
  "color-danger-text": ref("red-700"),
  "color-warning": ref("amber-400"),
  "color-on-warning": ref("gray-950"),
  "color-warning-subtle": ref("amber-100"),
  "color-warning-text": ref("amber-800"),
  "color-success": ref("green-700"),
  "color-on-success": ref("white"),
  "color-success-subtle": ref("green-100"),
  "color-success-text": ref("green-700"),
  "focus-ring-color": ref("blue-700"),
  "shadow-raised": "0 1px 2px oklch(0 0 0 / 0.06), 0 4px 12px oklch(0 0 0 / 0.08)",
  "shadow-overlay": "0 8px 24px oklch(0 0 0 / 0.12), 0 24px 48px oklch(0 0 0 / 0.12)",
};

/** Semantic values of the built-in dark theme. */
export const darkValues: Readonly<Record<SchemeTokenName, string>> = {
  ...shared,
  "color-scheme": "dark",
  "color-bg": ref("gray-950"),
  "color-surface": ref("gray-900"),
  "color-surface-raised": ref("gray-800"),
  "color-surface-sunken": ref("black"),
  "color-overlay": "oklch(0 0 0 / 0.6)",
  "color-text": ref("gray-50"),
  "color-text-muted": ref("gray-300"),
  "color-text-disabled": ref("gray-600"),
  "color-border": ref("gray-800"),
  "color-border-strong": ref("gray-400"),
  "color-control": ref("gray-800"),
  "color-control-hover": ref("gray-700"),
  "color-control-active": ref("gray-900"),
  "color-accent": ref("blue-400"),
  "color-accent-hover": ref("blue-300"),
  "color-accent-active": ref("blue-200"),
  "color-on-accent": ref("gray-950"),
  "color-accent-subtle": ref("blue-900"),
  "color-accent-text": ref("blue-300"),
  "color-danger": ref("red-400"),
  "color-danger-hover": ref("red-300"),
  "color-on-danger": ref("gray-950"),
  "color-danger-subtle": ref("red-950"),
  "color-danger-text": ref("red-300"),
  "color-warning": ref("amber-400"),
  "color-on-warning": ref("gray-950"),
  "color-warning-subtle": ref("amber-950"),
  "color-warning-text": ref("amber-300"),
  "color-success": ref("green-400"),
  "color-on-success": ref("gray-950"),
  "color-success-subtle": ref("green-950"),
  "color-success-text": ref("green-300"),
  "focus-ring-color": ref("blue-400"),
  "shadow-raised": "0 1px 2px oklch(0 0 0 / 0.4), 0 4px 12px oklch(0 0 0 / 0.4)",
  "shadow-overlay": "0 8px 24px oklch(0 0 0 / 0.5), 0 24px 48px oklch(0 0 0 / 0.5)",
};

/** Density values: comfortable is the default. */
export const comfortableValues: Readonly<Record<DensityTokenName, string>> = {
  "control-height": "2rem",
  "control-height-small": "1.5rem",
  "control-padding-x": ref("space-3"),
  "control-gap": ref("space-2"),
  "icon-size": "1.25rem",
  "target-size": "1.5rem",
  "gap-tight": ref("space-1"),
  "gap-normal": ref("space-2"),
  "gap-loose": ref("space-4"),
  "inset-tight": ref("space-2"),
  "inset-normal": ref("space-3"),
  "inset-loose": ref("space-5"),
};

/** Compact density: one step tighter, never below the 24 px target size. */
export const compactValues: Readonly<Partial<Record<DensityTokenName, string>>> = {
  "control-height": "1.75rem",
  "control-padding-x": ref("space-2"),
  "control-gap": ref("space-1"),
  "icon-size": "1rem",
  "gap-tight": "0.125rem",
  "gap-normal": ref("space-1"),
  "gap-loose": ref("space-3"),
  "inset-tight": ref("space-1"),
  "inset-normal": ref("space-2"),
  "inset-loose": ref("space-4"),
};

/**
 * Coarse pointers, such as touch screens, get 44 px targets in every density
 * (ADR 0014).
 */
export const coarsePointerValues: Readonly<Partial<Record<DensityTokenName, string>>> = {
  "control-height": "2.75rem",
  "control-height-small": "2.75rem",
  "target-size": "2.75rem",
};
