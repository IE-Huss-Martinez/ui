import {
  type ChangeEvent,
  forwardRef,
  type InputHTMLAttributes,
  type KeyboardEvent,
  useState,
} from "react";
import { warnInDevelopment } from "../../internal/development.js";
import { useFieldProps } from "../field/field-context.js";
import { decimals, roundTo } from "../shared/number.js";
import { cx, type StyleProps, unstyledAttribute } from "../shared/style-props.js";

/**
 * Props of {@link Slider}. Native input props are passed through.
 *
 * @public
 */
export interface SliderProps
  extends Omit<
      InputHTMLAttributes<HTMLInputElement>,
      | "className"
      | "type"
      | "value"
      | "defaultValue"
      | "min"
      | "max"
      | "step"
      | "onChange"
      | "aria-valuetext"
    >,
    StyleProps<"root"> {
  /** The value, when you control it. Leave it out to let the slider keep its own. */
  readonly value?: number | undefined;
  /** The starting value, when the slider keeps its own. Defaults to `min`. */
  readonly defaultValue?: number | undefined;
  /** Called with the new value as it changes, by pointer or keyboard. */
  readonly onValueChange?: ((value: number) => void) | undefined;
  /** Defaults to 0. */
  readonly min?: number | undefined;
  /** Defaults to 100. */
  readonly max?: number | undefined;
  /** The arrow keys' step, and the values the slider snaps to. Defaults to 1. */
  readonly step?: number | undefined;
  /**
   * The Page Up and Page Down step. Defaults to a tenth of the range, rounded
   * to a whole number of steps.
   */
  readonly largeStep?: number | undefined;
  /**
   * Writes the value as text for screen readers, such as "−6 dB" or "1:05",
   * exposed as `aria-valuetext`. Without it, they read the number. Format
   * for the user's locale, as `Intl.NumberFormat` does.
   */
  readonly formatValue?: ((value: number) => string) | undefined;
  /**
   * The accessible name, such as "Volume". Leave it out inside a `Field`,
   * or when a visible `<label>` points at the slider's `id`, or
   * `aria-labelledby` names it.
   */
  readonly label?: string | undefined;
}

/** Keeps a value in range and on a step from `min`, as the native input does. */
function snap(value: number, min: number, max: number, step: number): number {
  const precision = Math.max(decimals(min), decimals(step));
  // Rounds away float error, such as 3 × 0.1 = 0.30000000000000004, before
  // any comparison, so it can't look like an overshoot.
  const round = (n: number): number => roundTo(n, precision);
  const upper = Math.max(min, max);
  const stepped = round(step > 0 ? min + Math.round((value - min) / step) * step : value);
  // A step that doesn't divide the range can overshoot the top; step back.
  const inRange = stepped > upper && step > 0 ? round(stepped - step) : stepped;
  return Math.min(Math.max(inRange, min), upper);
}

/**
 * A slider for a value in a range, such as volume or zoom, on the native
 * `<input type="range">`.
 *
 * Arrow keys move by `step`, Page Up and Page Down by `largeStep`, and Home
 * and End to the ends. In right-to-left text, the slider is mirrored and the
 * left and right arrows follow it, in every browser. `formatValue` gives
 * screen readers the value as text.
 *
 * Inside a `Toolbar`, the slider keeps the arrow keys, Home and End, so
 * they can't move focus past it: put it last in the toolbar. Tab still
 * leaves the toolbar.
 *
 * It has no filled part of the track, because one would need an inline
 * style, which a strict Content Security Policy blocks.
 *
 * @example
 * ```tsx
 * <Slider
 *   label={messages.t("player.volume")}
 *   min={-60}
 *   max={0}
 *   value={gain}
 *   onValueChange={setGain}
 *   formatValue={(db) => messages.t("player.decibels", { db })}
 * />
 * ```
 *
 * @public
 */
export const Slider = /* @__PURE__ */ forwardRef<HTMLInputElement, SliderProps>(function Slider(
  {
    value: controlled,
    defaultValue,
    onValueChange,
    min = 0,
    max = 100,
    step = 1,
    largeStep,
    formatValue,
    label,
    className,
    classNames,
    unstyled,
    onKeyDown,
    ...props
  },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState(() => snap(defaultValue ?? min, min, max, step));
  const value = snap(controlled ?? uncontrolled, min, max, step);

  const fieldProps = useFieldProps(props, label);

  if (
    label === undefined &&
    !props["aria-label"] &&
    !props["aria-labelledby"] &&
    fieldProps.id === undefined
  ) {
    warnInDevelopment(
      "Slider needs an accessible name: pass label, or point a visible <label> at its id. Use text from your message catalogue.",
    );
  }

  const change = (next: number): void => {
    const snapped = snap(next, min, max, step);
    if (snapped === value) {
      return;
    }
    if (controlled === undefined) {
      setUncontrolled(snapped);
    }
    onValueChange?.(snapped);
  };

  // Pointer changes come from the native input.
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    change(event.currentTarget.valueAsNumber);
  };

  // Keys are handled here rather than by the browser, so every engine does
  // the same: WebKit doesn't mirror the arrow keys in right-to-left text.
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    onKeyDown?.(event);
    // Alt and Meta combinations stay with the browser and the system.
    if (event.defaultPrevented || event.altKey || event.metaKey) {
      return;
    }
    const large = largeStep ?? Math.max(step, Math.round((max - min) / 10 / step) * step);
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const targets: Record<string, number> = {
      ArrowUp: value + step,
      ArrowDown: value - step,
      ArrowRight: rtl ? value - step : value + step,
      ArrowLeft: rtl ? value + step : value - step,
      PageUp: value + large,
      PageDown: value - large,
      Home: min,
      End: max,
    };
    const next = targets[event.key];
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    change(next);
  };

  return (
    <input
      {...props}
      {...fieldProps}
      ref={ref}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label ?? props["aria-label"]}
      aria-valuetext={formatValue?.(value)}
      className={cx("hm-slider", classNames?.root, className)}
      data-hm-unstyled={unstyledAttribute(unstyled)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
});
