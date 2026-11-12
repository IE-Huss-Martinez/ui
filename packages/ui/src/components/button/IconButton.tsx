import { forwardRef, type ReactNode } from "react";
import { warnInDevelopment } from "../../internal/development.js";
import { type ClassNames, cx } from "../shared/style-props.js";
import { Button, type ButtonProps } from "./Button.js";

declare const process: { readonly env: { readonly NODE_ENV?: string } };

/**
 * Props of {@link IconButton}.
 *
 * @public
 */
export interface IconButtonProps
  extends Omit<ButtonProps, "startIcon" | "endIcon" | "children" | "classNames"> {
  /** The accessible name. Required, because the button shows no text. */
  readonly label: string;
  /** The icon. It draws with `currentColor`. */
  readonly icon: ReactNode;
  /** Extra classes on the root and the icon. */
  readonly classNames?: ClassNames<"root" | "icon"> | undefined;
}

/**
 * A square button with only an icon. `label` is its accessible name, so it
 * can't be left out.
 *
 * @example
 * ```tsx
 * <IconButton label={messages.t("toolbar.rotate")} icon={<RotateIcon />} onClick={rotate} />
 * ```
 *
 * @public
 */
export const IconButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ label, icon, className, ...props }, ref) {
    if (label.trim() === "") {
      if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
        warnInDevelopment(
          "IconButton needs a label: it's the button's only accessible name. Pass text from your message catalogue.",
        );
      }
    }
    return (
      <Button
        {...props}
        ref={ref}
        aria-label={label}
        className={cx("hm-icon-button", className)}
        startIcon={icon}
      />
    );
  },
);
