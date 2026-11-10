import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../shared/style-props.js";
import { useToolbar } from "./toolbar-context.js";

/**
 * Props of {@link ToolbarSeparator}.
 *
 * @public
 */
export type ToolbarSeparatorProps = Omit<HTMLAttributes<HTMLHRElement>, "children">;

/**
 * A line between toolbar items: a native `<hr>`, so it's a separator to
 * assistive technology. It isn't focusable, and is oriented across the
 * toolbar.
 *
 * @public
 */
export const ToolbarSeparator = /* @__PURE__ */ forwardRef<HTMLHRElement, ToolbarSeparatorProps>(
  function ToolbarSeparator({ className, ...props }, ref) {
    const toolbar = useToolbar();
    return (
      <hr
        {...props}
        ref={ref}
        aria-orientation={toolbar?.orientation === "vertical" ? "horizontal" : "vertical"}
        className={cx("hm-toolbar-separator", className)}
      />
    );
  },
);
