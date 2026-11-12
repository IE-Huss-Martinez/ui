import { forwardRef, type MouseEvent, type ReactNode, useState } from "react";
import { warnInDevelopment } from "../../internal/development.js";
import { Button, type ButtonPart, type ButtonProps, type ButtonVariant } from "../button/Button.js";
import { type ClassNames, cx } from "../shared/style-props.js";

declare const process: { readonly env: { readonly NODE_ENV?: string } };

/**
 * How prominent a toggle button is: `secondary` (the default), or `quiet` for
 * toolbars. There's no `primary` or `danger`: their solid fill would make a
 * toggle that's off look more active than one that's on.
 *
 * @public
 */
export type ToggleButtonVariant = Extract<ButtonVariant, "secondary" | "quiet">;

/**
 * Props every {@link ToggleButton} takes, with or without visible text.
 *
 * @public
 */
export interface ToggleButtonBaseProps
  extends Omit<
    ButtonProps,
    "variant" | "pressed" | "aria-pressed" | "children" | "startIcon" | "endIcon" | "classNames"
  > {
  /** Defaults to `secondary`. */
  readonly variant?: ToggleButtonVariant | undefined;
  /** Whether it's on, when you control it. Leave it out to let the button keep its own state. */
  readonly pressed?: boolean | undefined;
  /** Whether it starts on, when it keeps its own state. Defaults to `false`. */
  readonly defaultPressed?: boolean | undefined;
  /**
   * Called with the new state when the button is activated. Calling
   * `event.preventDefault()` in `onClick` stops the change.
   */
  readonly onPressedChange?: ((pressed: boolean) => void) | undefined;
}

/**
 * A toggle button with visible text, and optional icons beside it.
 *
 * @public
 */
export interface ToggleButtonTextProps extends ToggleButtonBaseProps {
  /** The label. It must say what the button turns on, and stay the same in both states. */
  readonly children: ReactNode;
  /** An icon before the label. It's decorative, and draws with `currentColor`. */
  readonly startIcon?: ReactNode;
  /** An icon after the label. */
  readonly endIcon?: ReactNode;
  /** Extra classes per part. */
  readonly classNames?: ClassNames<ButtonPart> | undefined;
  readonly icon?: undefined;
  readonly label?: undefined;
}

/**
 * A square toggle button with only an icon.
 *
 * @public
 */
export interface ToggleButtonIconProps extends ToggleButtonBaseProps {
  /** The icon. It draws with `currentColor`. */
  readonly icon: ReactNode;
  /** The accessible name. Required, because the button shows no text. It stays the same in both states. */
  readonly label: string;
  /** Extra classes on the root and the icon. */
  readonly classNames?: ClassNames<"root" | "icon"> | undefined;
  readonly children?: undefined;
  readonly startIcon?: undefined;
  readonly endIcon?: undefined;
}

/**
 * Props of {@link ToggleButton}: visible text, or an icon with a `label`.
 *
 * @public
 */
export type ToggleButtonProps = ToggleButtonTextProps | ToggleButtonIconProps;

/**
 * A button that turns something on or off, such as loop playback or the
 * active tool, exposed as `aria-pressed`. Controlled with `pressed` and
 * `onPressedChange`, or keeping its own state from `defaultPressed`.
 *
 * Its label names what it turns on and never changes with the state: screen
 * readers announce the state. For a button whose label changes, such as
 * play and pause, use `IconButton` or `Button` and swap the label instead.
 *
 * Inside a `Toolbar`, it's a toolbar item like any button: arrow keys reach
 * it, and Space or Enter toggles it.
 *
 * @example
 * ```tsx
 * <ToggleButton
 *   label={messages.t("player.loop")}
 *   icon={<LoopIcon />}
 *   pressed={loop}
 *   onPressedChange={setLoop}
 * />
 * ```
 *
 * @public
 */
export const ToggleButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, ToggleButtonProps>(
  function ToggleButton(
    {
      pressed: controlled,
      defaultPressed = false,
      onPressedChange,
      onClick,
      icon,
      label,
      className,
      ...props
    },
    ref,
  ) {
    const [uncontrolled, setUncontrolled] = useState(defaultPressed);
    const pressed = controlled ?? uncontrolled;
    const iconOnly = label !== undefined;
    if (iconOnly && label.trim() === "") {
      if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
        warnInDevelopment(
          "ToggleButton needs a label when it shows only an icon: it's the button's only accessible name. Pass text from your message catalogue.",
        );
      }
    }

    // Button doesn't call onClick while it's disabled but focusable, so a
    // disabled toggle never changes.
    const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
      onClick?.(event);
      if (event.defaultPrevented) {
        return;
      }
      if (controlled === undefined) {
        setUncontrolled(!pressed);
      }
      onPressedChange?.(!pressed);
    };

    return (
      <Button
        {...props}
        ref={ref}
        {...(iconOnly ? { "aria-label": label, startIcon: icon } : {})}
        className={cx("hm-toggle-button", iconOnly && "hm-icon-button", className)}
        pressed={pressed}
        onClick={handleClick}
      />
    );
  },
);
