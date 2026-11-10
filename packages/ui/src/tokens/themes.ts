import type { DensityTokenName, SemanticTokenName } from "./definitions.js";

/** Semantic tokens set by the colour mode: everything except density tokens. */
export type SchemeTokenName = Exclude<SemanticTokenName, DensityTokenName>;

/** Values shared by both built-in themes: type, shape, motion and stacking. */
const shared = {
  "focus-ring-width": "2px",
  "focus-ring-offset": "2px",
  "focus-ring": "var(--hm-focus-ring-width) solid var(--hm-focus-ring-color)",
  "font-family": "var(--hm-font-sans)",
  "font-family-mono": "var(--hm-font-mono)",
  "font-size-small": "var(--hm-font-size-2)",
  "font-size-body": "var(--hm-font-size-3)",
  "font-size-title": "var(--hm-font-size-6)",
  "font-weight-regular": "var(--hm-font-weight-400)",
  "font-weight-strong": "var(--hm-font-weight-600)",
  "line-height-body": "var(--hm-leading-normal)",
  "line-height-tight": "var(--hm-leading-tight)",
  "letter-spacing": "0",
  "radius-control": "var(--hm-radius-md)",
  "radius-surface": "var(--hm-radius-lg)",
  "radius-round": "var(--hm-radius-full)",
  "border-width": "var(--hm-border-width-1)",
  "motion-duration-feedback": "var(--hm-duration-fast)",
  "motion-duration-enter": "var(--hm-duration-normal)",
  "motion-duration-exit": "var(--hm-duration-fast)",
  "motion-easing-standard": "var(--hm-easing-standard)",
  "motion-easing-enter": "var(--hm-easing-decelerate)",
  "motion-easing-exit": "var(--hm-easing-accelerate)",
  "z-raised": "1",
  "z-sticky": "10",
  "z-overlay": "100",
  "opacity-disabled": "0.5",
} as const;

/** Semantic values of the built-in light theme. */
/**
 * Adds the shared values. A pure call with plain-data arguments rather than
 * a spread at module scope, which bundlers can't drop, because spreading
 * could run getters. The values are literal strings for the same reason.
 */
function withShared<T extends object>(values: T): typeof shared & T {
  return { ...shared, ...values };
}

export const lightValues: Readonly<Record<SchemeTokenName, string>> = /* @__PURE__ */ withShared({
  "color-scheme": "light",
  "color-bg": "var(--hm-white)",
  "color-surface": "var(--hm-gray-50)",
  "color-surface-raised": "var(--hm-white)",
  "color-surface-sunken": "var(--hm-gray-100)",
  "color-overlay": "oklch(0.26 0.01 260 / 0.5)",
  "color-text": "var(--hm-gray-900)",
  "color-text-muted": "var(--hm-gray-700)",
  "color-text-disabled": "var(--hm-gray-400)",
  "color-border": "var(--hm-gray-200)",
  "color-border-strong": "var(--hm-gray-600)",
  "color-control": "var(--hm-gray-100)",
  "color-control-hover": "var(--hm-gray-200)",
  "color-control-active": "var(--hm-gray-300)",
  "color-accent": "var(--hm-blue-700)",
  "color-accent-hover": "var(--hm-blue-800)",
  "color-accent-active": "var(--hm-blue-900)",
  "color-on-accent": "var(--hm-white)",
  "color-accent-subtle": "var(--hm-blue-100)",
  "color-accent-text": "var(--hm-blue-700)",
  "color-danger": "var(--hm-red-600)",
  "color-danger-hover": "var(--hm-red-700)",
  "color-on-danger": "var(--hm-white)",
  "color-danger-subtle": "var(--hm-red-100)",
  "color-danger-text": "var(--hm-red-700)",
  "color-warning": "var(--hm-amber-400)",
  "color-on-warning": "var(--hm-gray-950)",
  "color-warning-subtle": "var(--hm-amber-100)",
  "color-warning-text": "var(--hm-amber-800)",
  "color-success": "var(--hm-green-700)",
  "color-on-success": "var(--hm-white)",
  "color-success-subtle": "var(--hm-green-100)",
  "color-success-text": "var(--hm-green-700)",
  "focus-ring-color": "var(--hm-blue-700)",
  "shadow-raised": "0 1px 2px oklch(0 0 0 / 0.06), 0 4px 12px oklch(0 0 0 / 0.08)",
  "shadow-overlay": "0 8px 24px oklch(0 0 0 / 0.12), 0 24px 48px oklch(0 0 0 / 0.12)",
});

/** Semantic values of the built-in dark theme. */
export const darkValues: Readonly<Record<SchemeTokenName, string>> = /* @__PURE__ */ withShared({
  "color-scheme": "dark",
  "color-bg": "var(--hm-gray-950)",
  "color-surface": "var(--hm-gray-900)",
  "color-surface-raised": "var(--hm-gray-800)",
  "color-surface-sunken": "var(--hm-black)",
  "color-overlay": "oklch(0 0 0 / 0.6)",
  "color-text": "var(--hm-gray-50)",
  "color-text-muted": "var(--hm-gray-300)",
  "color-text-disabled": "var(--hm-gray-600)",
  "color-border": "var(--hm-gray-800)",
  "color-border-strong": "var(--hm-gray-400)",
  "color-control": "var(--hm-gray-800)",
  "color-control-hover": "var(--hm-gray-700)",
  "color-control-active": "var(--hm-gray-900)",
  "color-accent": "var(--hm-blue-400)",
  "color-accent-hover": "var(--hm-blue-300)",
  "color-accent-active": "var(--hm-blue-200)",
  "color-on-accent": "var(--hm-gray-950)",
  "color-accent-subtle": "var(--hm-blue-900)",
  "color-accent-text": "var(--hm-blue-300)",
  "color-danger": "var(--hm-red-400)",
  "color-danger-hover": "var(--hm-red-300)",
  "color-on-danger": "var(--hm-gray-950)",
  "color-danger-subtle": "var(--hm-red-950)",
  "color-danger-text": "var(--hm-red-300)",
  "color-warning": "var(--hm-amber-400)",
  "color-on-warning": "var(--hm-gray-950)",
  "color-warning-subtle": "var(--hm-amber-950)",
  "color-warning-text": "var(--hm-amber-300)",
  "color-success": "var(--hm-green-400)",
  "color-on-success": "var(--hm-gray-950)",
  "color-success-subtle": "var(--hm-green-950)",
  "color-success-text": "var(--hm-green-300)",
  "focus-ring-color": "var(--hm-blue-400)",
  "shadow-raised": "0 1px 2px oklch(0 0 0 / 0.4), 0 4px 12px oklch(0 0 0 / 0.4)",
  "shadow-overlay": "0 8px 24px oklch(0 0 0 / 0.5), 0 24px 48px oklch(0 0 0 / 0.5)",
});

/** Density values: comfortable is the default. */
export const comfortableValues: Readonly<Record<DensityTokenName, string>> = {
  "control-height": "2rem",
  "control-height-small": "1.5rem",
  "control-padding-x": "var(--hm-space-3)",
  "control-gap": "var(--hm-space-2)",
  "icon-size": "1.25rem",
  "target-size": "1.5rem",
  "gap-tight": "var(--hm-space-1)",
  "gap-normal": "var(--hm-space-2)",
  "gap-loose": "var(--hm-space-4)",
  "inset-tight": "var(--hm-space-2)",
  "inset-normal": "var(--hm-space-3)",
  "inset-loose": "var(--hm-space-5)",
};

/** Compact density: one step tighter, never below the 24 px target size. */
export const compactValues: Readonly<Partial<Record<DensityTokenName, string>>> = {
  "control-height": "1.75rem",
  "control-padding-x": "var(--hm-space-2)",
  "control-gap": "var(--hm-space-1)",
  "icon-size": "1rem",
  "gap-tight": "0.125rem",
  "gap-normal": "var(--hm-space-1)",
  "gap-loose": "var(--hm-space-3)",
  "inset-tight": "var(--hm-space-1)",
  "inset-normal": "var(--hm-space-2)",
  "inset-loose": "var(--hm-space-4)",
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
