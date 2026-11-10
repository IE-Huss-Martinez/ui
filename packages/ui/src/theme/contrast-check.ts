import { baseValues } from "../tokens/base.js";
import { contrastPairs } from "../tokens/contrast.js";
import { contrastRatio, resolveColor } from "./color.js";
import type { Theme } from "./types.js";

/**
 * Result of checking a theme's colour pairs against WCAG 2.2 AA.
 *
 * @public
 */
export interface ContrastReport {
  /** Pairs below their minimum ratio, with the ratio they have. */
  readonly failures: readonly {
    readonly foreground: string;
    readonly background: string;
    readonly ratio: number;
    readonly minimum: number;
  }[];
  /**
   * Pairs that couldn't be checked, because a colour can't be computed
   * without a browser, such as `color-mix()`, or its background is translucent.
   */
  readonly unchecked: readonly { readonly foreground: string; readonly background: string }[];
}

/**
 * Checks a theme's text, boundary and focus colours against WCAG 2.2 AA
 * contrast. References to base tokens the theme doesn't set resolve to the
 * built-in values, as they do on the page.
 *
 * @public
 */
export function checkContrast(theme: Theme): ContrastReport {
  const lookup = (token: string): string | undefined =>
    theme.tokens[token] ?? (baseValues as Record<string, string>)[token];
  const failures: ContrastReport["failures"][number][] = [];
  const unchecked: ContrastReport["unchecked"][number][] = [];
  for (const { foreground, background, minimum } of contrastPairs) {
    const front = lookup(foreground);
    const back = lookup(background);
    const frontColor = front === undefined ? undefined : resolveColor(front, lookup);
    const backColor = back === undefined ? undefined : resolveColor(back, lookup);
    const ratio = frontColor && backColor ? contrastRatio(frontColor, backColor) : undefined;
    if (ratio === undefined) {
      unchecked.push({ foreground, background });
    } else if (ratio < minimum) {
      failures.push({ foreground, background, ratio: Math.round(ratio * 100) / 100, minimum });
    }
  }
  return { failures, unchecked };
}
