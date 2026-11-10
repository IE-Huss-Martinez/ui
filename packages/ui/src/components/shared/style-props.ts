/**
 * Extra classes for a component's named parts.
 *
 * @public
 */
export type ClassNames<Part extends string> = { readonly [Name in Part]?: string };

/**
 * Styling props every component takes (STANDARDS: React API).
 *
 * @public
 */
export interface StyleProps<Part extends string> {
  /** Extra classes on the root element. */
  readonly className?: string | undefined;
  /** Extra classes on each named part. */
  readonly classNames?: ClassNames<Part> | undefined;
  /**
   * Drops the visual styles (colours, borders, typography, motion) and keeps
   * layout, focus indication and target sizes, so the component stays
   * accessible while you style it yourself.
   */
  readonly unstyled?: boolean | undefined;
}

/** Joins class names, skipping empty ones. */
export function cx(...values: (string | false | null | undefined)[]): string | undefined {
  const joined = values.filter(Boolean).join(" ");
  return joined === "" ? undefined : joined;
}

/** The attribute that turns a component's visual rules off. */
export function unstyledAttribute(unstyled: boolean | undefined): "" | undefined {
  return unstyled ? "" : undefined;
}
