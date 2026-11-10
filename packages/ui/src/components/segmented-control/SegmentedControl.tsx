import {
  type ForwardedRef,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefAttributes,
} from "react";
import { cx, type StyleProps, unstyledAttribute } from "../shared/style-props.js";
import { useToolbar } from "../toolbar/toolbar-context.js";

/**
 * One choice in a {@link SegmentedControl}.
 *
 * @public
 */
export interface SegmentedControlOption<Value extends string> {
  readonly value: Value;
  /** The option's text, and its accessible name when `hideLabel` is set. */
  readonly label: string;
  /** An icon before the label. It draws with `currentColor`. */
  readonly icon?: ReactNode;
  /** Shows only the icon; `label` stays the accessible name. */
  readonly hideLabel?: boolean;
  readonly disabled?: boolean;
}

/**
 * The parts of a segmented control that `classNames` can target.
 *
 * @public
 */
export type SegmentedControlPart = "root" | "option" | "icon" | "label";

/**
 * Props of {@link SegmentedControl}.
 *
 * @public
 */
export interface SegmentedControlProps<Value extends string>
  extends Omit<HTMLAttributes<HTMLDivElement>, "className" | "role" | "onChange">,
    StyleProps<SegmentedControlPart> {
  /** The group's accessible name, such as "View". Required. */
  readonly label: string;
  /** The selected option's value. The control is always controlled. */
  readonly value: Value;
  readonly onValueChange: (value: Value) => void;
  readonly options: readonly SegmentedControlOption<Value>[];
  /** Defaults to `medium`. */
  readonly size?: "medium" | "small" | undefined;
}

function SegmentedControlImpl<Value extends string>(
  {
    label,
    value,
    onValueChange,
    options,
    size = "medium",
    className,
    classNames,
    unstyled,
    onKeyDown,
    ...props
  }: SegmentedControlProps<Value>,
  ref: ForwardedRef<HTMLDivElement>,
): ReactElement {
  // Inside a toolbar, the toolbar owns focus: arrows only move, and Space or
  // Enter selects (APG toolbar). Standalone, it's a radio group: one Tab stop
  // on the selected option, and arrows move and select (APG radio group).
  const inToolbar = useToolbar() !== undefined;
  const enabled = options.filter((option) => !option.disabled);
  const tabStop = enabled.find((option) => option.value === value) ?? enabled[0];

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    onKeyDown?.(event);
    if (inToolbar || event.defaultPrevented) {
      return;
    }
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (step === 0 || enabled.length === 0) {
      return;
    }
    event.preventDefault();
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const horizontal = event.key === "ArrowRight" || event.key === "ArrowLeft";
    const direction = rtl && horizontal ? -step : step;
    const current = Math.max(
      0,
      enabled.findIndex((option) => option.value === value),
    );
    const next = enabled[(current + direction + enabled.length) % enabled.length];
    if (next) {
      onValueChange(next.value);
      event.currentTarget
        .querySelector<HTMLElement>(`[data-hm-value="${CSS.escape(next.value)}"]`)
        ?.focus();
    }
  };

  return (
    <div
      {...props}
      ref={ref}
      role="radiogroup"
      aria-label={label}
      className={cx(
        "hm-segmented-control",
        size === "small" && "hm-segmented-control--small",
        classNames?.root,
        className,
      )}
      data-hm-unstyled={unstyledAttribute(unstyled)}
      onKeyDown={handleKeyDown}
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          // biome-ignore lint/a11y/useSemanticElements: native radios select on arrow keys, which a toolbar must not do; buttons with role="radio" are the APG pattern.
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.hideLabel ? option.label : undefined}
            disabled={option.disabled}
            tabIndex={inToolbar ? undefined : option === tabStop ? 0 : -1}
            data-hm-value={option.value}
            className={cx("hm-segmented-control-option", classNames?.option)}
            onClick={() => {
              if (!checked) {
                onValueChange(option.value);
              }
            }}
          >
            {option.icon == null ? null : (
              <span
                className={cx("hm-segmented-control-icon", classNames?.icon)}
                aria-hidden="true"
              >
                {option.icon}
              </span>
            )}
            {option.hideLabel ? null : (
              <span className={cx("hm-segmented-control-label", classNames?.label)}>
                {option.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A small set of mutually exclusive choices shown side by side, such as a
 * view mode. It's a WAI-ARIA radio group: arrow keys move and select. Inside a
 * {@link Toolbar}, it joins the toolbar's arrow-key navigation instead, and
 * Space or Enter selects.
 *
 * @example
 * ```tsx
 * <SegmentedControl
 *   label={messages.t("view.label")}
 *   value={view}
 *   onValueChange={setView}
 *   options={[
 *     { value: "single", label: messages.t("view.single") },
 *     { value: "grid", label: messages.t("view.grid"), icon: <GridIcon />, hideLabel: true },
 *   ]}
 * />
 * ```
 *
 * @public
 */
export const SegmentedControl = /* @__PURE__ */ forwardRef(SegmentedControlImpl) as <
  Value extends string,
>(
  props: SegmentedControlProps<Value> & RefAttributes<HTMLDivElement>,
) => ReactElement;
