import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../shared/style-props.js";

/**
 * Props of {@link ToolbarGroup}.
 *
 * @public
 */
export interface ToolbarGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  /** The group's accessible name, such as "Zoom". Required. */
  readonly label: string;
}

/**
 * Related items in a toolbar, announced together as a named group. Arrow keys
 * move across groups as if they weren't there.
 *
 * @public
 */
export const ToolbarGroup = /* @__PURE__ */ forwardRef<HTMLDivElement, ToolbarGroupProps>(
  function ToolbarGroup({ label, className, ...props }, ref) {
    return (
      // biome-ignore lint/a11y/useSemanticElements: a fieldset brings form semantics and legend rendering a toolbar group shouldn't have.
      <div
        {...props}
        ref={ref}
        role="group"
        aria-label={label}
        className={cx("hm-toolbar-group", className)}
      />
    );
  },
);
