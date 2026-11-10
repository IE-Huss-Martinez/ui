import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../shared/style-props.js";

/**
 * Props of {@link VisuallyHidden}.
 *
 * @public
 */
export interface VisuallyHiddenProps extends HTMLAttributes<HTMLElement> {
  /** The element to render. Defaults to `span`. */
  readonly as?: "span" | "div";
}

/**
 * Content for assistive technology only: hidden on screen, but read out and
 * part of the accessible name of its parent. It has no `unstyled` prop,
 * because hiding is its whole purpose.
 *
 * @public
 */
export const VisuallyHidden = /* @__PURE__ */ forwardRef<HTMLElement, VisuallyHiddenProps>(
  function VisuallyHidden({ as: Element = "span", className, ...props }, ref) {
    return (
      <Element {...props} ref={ref as never} className={cx("hm-visually-hidden", className)} />
    );
  },
);
