import type { SemanticTokenName } from "./definitions.js";

/**
 * A foreground token that must contrast with a background token, and the
 * smallest WCAG 2.2 ratio it needs.
 *
 * @public
 */
export interface ContrastPair {
  readonly foreground: SemanticTokenName;
  readonly background: SemanticTokenName;
  /** 4.5 for text (WCAG 1.4.3), 3 for boundaries and focus indicators (WCAG 1.4.11). */
  readonly minimum: 4.5 | 3;
}

const TEXT = 4.5;
const NON_TEXT = 3;

const SURFACES = ["color-bg", "color-surface", "color-surface-raised"] as const;

/** Builds the pairs. A function, so importing this module has no side effects. */
function buildPairs(): readonly ContrastPair[] {
  const pairs: ContrastPair[] = [];
  const needs = (
    foreground: SemanticTokenName,
    backgrounds: readonly SemanticTokenName[],
    minimum: 4.5 | 3,
  ): void => {
    for (const background of backgrounds) {
      pairs.push({ foreground, background, minimum });
    }
  };

  // Text on every surface.
  needs("color-text", [...SURFACES, "color-surface-sunken"], TEXT);
  needs("color-text-muted", SURFACES, TEXT);
  needs("color-accent-text", SURFACES, TEXT);
  needs("color-danger-text", [...SURFACES, "color-danger-subtle"], TEXT);
  needs("color-warning-text", [...SURFACES, "color-warning-subtle"], TEXT);
  needs("color-success-text", [...SURFACES, "color-success-subtle"], TEXT);
  // Text on controls and fills, including their hover and pressed states.
  needs("color-text", ["color-control", "color-control-hover", "color-control-active"], TEXT);
  needs("color-text", ["color-accent-subtle"], TEXT);
  needs("color-on-accent", ["color-accent", "color-accent-hover", "color-accent-active"], TEXT);
  needs("color-on-danger", ["color-danger", "color-danger-hover"], TEXT);
  needs("color-on-warning", ["color-warning"], TEXT);
  needs("color-on-success", ["color-success"], TEXT);
  // Boundaries and indicators that identify a control or its state.
  needs("color-border-strong", SURFACES, NON_TEXT);
  needs("color-accent", SURFACES, NON_TEXT);
  // The fill of a progress bar against its track.
  needs("color-accent", ["color-surface-sunken"], NON_TEXT);
  needs("focus-ring-color", SURFACES, NON_TEXT);
  return Object.freeze(pairs);
}

/**
 * The colour pairs every theme must meet, as checked by `createTheme` in
 * development and by the tests for the built-in themes.
 *
 * @public
 */
export const contrastPairs: readonly ContrastPair[] = /* @__PURE__ */ buildPairs();
