import { forwardRef, type ProgressHTMLAttributes } from "react";
import { useUiText } from "../messages/UiMessagesProvider.js";
import { cx, type StyleProps, unstyledAttribute } from "../shared/style-props.js";

/**
 * Props of {@link ProgressBar}.
 *
 * @public
 */
export interface ProgressBarProps
  extends Omit<ProgressHTMLAttributes<HTMLProgressElement>, "className" | "value" | "max">,
    StyleProps<"root"> {
  /** How much is done, from 0 to `max`. Leave it out while the amount is unknown. */
  readonly value?: number | undefined;
  /** Defaults to 100. */
  readonly max?: number | undefined;
  /** What's in progress. Defaults to `progress.label` from the messages ("Progress"). */
  readonly label?: string | undefined;
  /** The value as words, such as "Page 3 of 12", read instead of a percentage. */
  readonly valueText?: string | undefined;
}

/**
 * Shows how much of a task is done, on the native `<progress>` element: no
 * inline styles, so it renders correctly under a strict Content Security
 * Policy, before hydration too. Without `value`, it's indeterminate and
 * pulses, or stays still under reduced motion.
 *
 * @example
 * ```tsx
 * <ProgressBar value={done} max={total} label={messages.t("export.progress")} />
 * ```
 *
 * @public
 */
export const ProgressBar = /* @__PURE__ */ forwardRef<HTMLProgressElement, ProgressBarProps>(
  function ProgressBar(
    { value, max = 100, label, valueText, className, classNames, unstyled, ...props },
    ref,
  ) {
    const defaultLabel = useUiText("progress.label");
    const clamped = value === undefined ? undefined : Math.min(Math.max(value, 0), max);
    return (
      <progress
        {...props}
        ref={ref}
        value={clamped}
        max={max}
        aria-label={label ?? defaultLabel}
        aria-valuetext={valueText}
        className={cx("hm-progress-bar", classNames?.root, className)}
        data-hm-unstyled={unstyledAttribute(unstyled)}
      />
    );
  },
);
