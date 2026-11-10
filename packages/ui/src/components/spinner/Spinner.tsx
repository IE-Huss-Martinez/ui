import { forwardRef, type HTMLAttributes } from "react";
import { useUiText } from "../messages/UiMessagesProvider.js";
import { cx, type StyleProps, unstyledAttribute } from "../shared/style-props.js";

/**
 * Props of {@link Spinner}.
 *
 * @public
 */
export interface SpinnerProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "className" | "role" | "children">,
    StyleProps<"root"> {
  /** What's loading. Defaults to `spinner.label` from the messages ("Loading"). */
  readonly label?: string | undefined;
}

/**
 * Shows that something is loading, for an unknown time. It's an
 * indeterminate progress bar to assistive technology, named by `label`.
 * Under reduced motion it pulses slowly instead of turning. Its size follows
 * `--hm-spinner-size`.
 *
 * @example
 * ```tsx
 * <Spinner label={messages.t("pages.loading")} />
 * ```
 *
 * @public
 */
export const Spinner = /* @__PURE__ */ forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { label, className, classNames, unstyled, ...props },
  ref,
) {
  const defaultLabel = useUiText("spinner.label");
  return (
    // A native <progress> can't be drawn as a ring, so this takes its role.
    <span
      {...props}
      ref={ref}
      role="progressbar"
      aria-label={label ?? defaultLabel}
      className={cx("hm-spinner", classNames?.root, className)}
      data-hm-unstyled={unstyledAttribute(unstyled)}
    />
  );
});
