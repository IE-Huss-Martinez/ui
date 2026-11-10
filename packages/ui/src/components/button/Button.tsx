import { type ButtonHTMLAttributes, forwardRef, type MouseEvent, type ReactNode } from "react";
import { cx, type StyleProps, unstyledAttribute } from "../shared/style-props.js";

/**
 * How prominent a button is: `primary` for the main action, `secondary`
 * (the default) for others, `quiet` for toolbars and dense places, `danger`
 * for destructive actions.
 *
 * @public
 */
export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

/**
 * Button sizes. Both meet the 24 px target size, and 44 px on coarse
 * pointers (ADR 0014).
 *
 * @public
 */
export type ButtonSize = "medium" | "small";

/**
 * The parts of a button that `classNames` can target.
 *
 * @public
 */
export type ButtonPart = "root" | "icon" | "label";

/**
 * Props of {@link Button}. Native button props are passed through.
 *
 * @public
 */
export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">,
    StyleProps<ButtonPart> {
  /** Defaults to `secondary`. */
  readonly variant?: ButtonVariant | undefined;
  /** Defaults to `medium`. */
  readonly size?: ButtonSize | undefined;
  /** Makes it a toggle button, on or off, exposed as `aria-pressed`. */
  readonly pressed?: boolean | undefined;
  /** An icon before the label. It's decorative, and draws with `currentColor`. */
  readonly startIcon?: ReactNode;
  /** An icon after the label. */
  readonly endIcon?: ReactNode;
  /**
   * Keeps a disabled button focusable, with `aria-disabled` instead of the
   * `disabled` attribute, so it stays in a toolbar's keyboard order and
   * screen readers can find it. Clicks are ignored.
   */
  readonly focusableWhenDisabled?: boolean | undefined;
}

function Icon({ children, className }: { children: ReactNode; className: string | undefined }) {
  return (
    <span className={cx("hm-button-icon", className)} aria-hidden="true">
      {children}
    </span>
  );
}

/**
 * A button: a native `<button>`, `type="button"` unless you say otherwise.
 *
 * @example
 * ```tsx
 * <Button variant="primary" startIcon={<DownloadIcon />} onClick={save}>
 *   {messages.t("toolbar.download")}
 * </Button>
 * ```
 *
 * @public
 */
export const Button = /* @__PURE__ */ forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "medium",
    pressed,
    startIcon,
    endIcon,
    focusableWhenDisabled,
    disabled,
    className,
    classNames,
    unstyled,
    type = "button",
    onClick,
    children,
    ...props
  },
  ref,
) {
  const softDisabled = Boolean(focusableWhenDisabled && disabled);
  const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
    if (softDisabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  return (
    <button
      {...props}
      ref={ref}
      // biome-ignore lint/a11y/useButtonType: the type comes from props, and defaults to "button".
      type={type}
      className={cx(
        "hm-button",
        `hm-button--${variant}`,
        size === "small" && "hm-button--small",
        classNames?.root,
        className,
      )}
      data-hm-unstyled={unstyledAttribute(unstyled)}
      aria-pressed={pressed}
      disabled={softDisabled ? undefined : disabled}
      aria-disabled={softDisabled ? true : props["aria-disabled"]}
      onClick={handleClick}
    >
      {startIcon == null ? null : <Icon className={classNames?.icon}>{startIcon}</Icon>}
      {children == null ? null : (
        <span className={cx("hm-button-label", classNames?.label)}>{children}</span>
      )}
      {endIcon == null ? null : <Icon className={classNames?.icon}>{endIcon}</Icon>}
    </button>
  );
});
