import {
  type ChangeEvent,
  type FocusEvent,
  forwardRef,
  type InputHTMLAttributes,
  type KeyboardEvent,
  useMemo,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { warnInDevelopment } from "../../internal/development.js";
import { useFieldProps } from "../field/field-context.js";
import { useUiLocale } from "../messages/UiMessagesProvider.js";
import { decimals, roundTo } from "../shared/number.js";
import { cx, type StyleProps, unstyledAttribute } from "../shared/style-props.js";

declare const process: { readonly env: { readonly NODE_ENV?: string } };

/**
 * Props of {@link NumberField}. Native input props are passed through.
 *
 * @public
 */
export interface NumberFieldProps
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
      | "role"
      | "aria-valuenow"
      | "aria-valuemin"
      | "aria-valuemax"
      | "aria-valuetext"
    >,
    StyleProps<"root"> {
  /** The value, when you control it. Leave it out to let the field keep its own. */
  readonly value?: number | undefined;
  /** The starting value, when the field keeps its own. Defaults to 0, kept within `min` and `max`. */
  readonly defaultValue?: number | undefined;
  /**
   * Called with the new value when it's committed: on blur, on Enter, or
   * with the arrow and Page keys. Never with `NaN`, and never while typing.
   */
  readonly onValueChange?: ((value: number) => void) | undefined;
  /** The smallest value. Values below it are raised to it. */
  readonly min?: number | undefined;
  /** The largest value. Values above it are lowered to it. */
  readonly max?: number | undefined;
  /** The Arrow Up and Arrow Down step. Defaults to 1. Typed values aren't snapped to it. */
  readonly step?: number | undefined;
  /** The Page Up and Page Down step. Defaults to ten steps. */
  readonly largeStep?: number | undefined;
  /**
   * The locale for the default `parse` and `format`, such as `"de"`.
   * Defaults to the locale of `UiMessagesProvider`, or `"en"`.
   */
  readonly locale?: string | undefined;
  /**
   * Reads typed text as a number, or returns `undefined` when it isn't one.
   * Defaults to the locale's digits, decimal and group separators, and minus
   * sign. Replace it for other notations, such as a timecode.
   */
  readonly parse?: ((text: string) => number | undefined) | undefined;
  /**
   * Writes a value as text: the field shows it, and screen readers read it.
   * Defaults to the locale's number format.
   */
  readonly format?: ((value: number) => string) | undefined;
  /**
   * The accessible name, such as "Zoom". Leave it out inside a `Field`, or
   * when a visible `<label>` points at the field's `id`, or
   * `aria-labelledby` names it.
   */
  readonly label?: string | undefined;
}

/** How a locale writes numbers, learned from `Intl.NumberFormat`. */
export interface Notation {
  readonly group: string;
  readonly decimal: string;
  readonly digits: ReadonlyMap<string, string>;
}

export function notationOf(locale: string): Notation {
  const parts = new Intl.NumberFormat(locale).formatToParts(-12345.6);
  const digits = new Map<string, string>();
  const native = new Intl.NumberFormat(locale, { useGrouping: false }).format(9876543210);
  [...native].forEach((digit, index) => {
    digits.set(digit, String(9 - index));
  });
  return {
    group: parts.find((part) => part.type === "group")?.value ?? ",",
    decimal: parts.find((part) => part.type === "decimal")?.value ?? ".",
    digits,
  };
}

/** Spaces people type for a locale whose group separator is space-like. */
const SPACE = /[\s\u00a0\u202f]/;

/** Escapes a separator for use in a regular expression. */
const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Matches the group separators people type for a locale. */
function groupPattern(group: string): RegExp {
  if (SPACE.test(group)) {
    return /[\s\u00a0\u202f]/;
  }
  // Swiss German groups with an apostrophe: ' or ’, depending on the
  // engine's data, and people type either.
  if (/^['\u2019]$/.test(group)) {
    return /['\u2019]/;
  }
  return new RegExp(escapeRegExp(group));
}

/**
 * Whether an integer part's groups are where the locale puts them: 1 to 3
 * digits, then groups of 2 or 3, ending in a group of 3, as in 1,234,567
 * or en-IN's 12,34,567. Otherwise a separator is a typo, or another
 * locale's decimal point, such as "2.5" typed in German, and reading it as
 * a group would silently multiply the value.
 */
function groupsInPlace(groups: readonly string[]): boolean {
  const last = groups.length - 1;
  return groups.every((group, index) =>
    index === 0
      ? /^\d{1,3}$/.test(group)
      : index === last
        ? /^\d{3}$/.test(group)
        : /^\d{2,3}$/.test(group),
  );
}

/**
 * Reads a number the way a locale writes it: its digits, decimal separator
 * and group separators, with an optional minus sign, hyphen or plus. Strict:
 * anything else, such as letters, an exponent or a group separator out of
 * place, isn't a number.
 */
export function parseIn(notation: Notation, text: string): number | undefined {
  let normal = "";
  // Bidirectional marks, such as the one before Arabic's minus sign, aren't
  // part of the number.
  for (const character of text.replace(/[\u061c\u200e\u200f]/g, "").trim()) {
    normal += notation.digits.get(character) ?? character;
  }
  const sign = /^[-+\u2212]/.exec(normal)?.[0];
  if (sign !== undefined) {
    normal = normal.slice(1);
  }
  const parts = normal.split(notation.decimal);
  if (parts.length > 2) {
    return undefined;
  }
  const groups = (parts[0] ?? "").split(groupPattern(notation.group));
  if (groups.length > 1 && !groupsInPlace(groups)) {
    return undefined;
  }
  const integer = groups.join("");
  const fraction = parts[1] ?? "";
  if (!/^\d*$/.test(integer) || !/^\d*$/.test(fraction) || integer + fraction === "") {
    return undefined;
  }
  const value = Number(
    `${sign === "+" || sign === undefined ? "" : "-"}${integer || "0"}.${fraction || "0"}`,
  );
  return Number.isFinite(value) ? value : undefined;
}

/**
 * A number input: a text field exposed as a spin button, with locale-aware
 * parsing and formatting.
 *
 * Typing never changes the value: the text is committed on blur or Enter,
 * then kept within `min` and `max`. Text that isn't a number, or no text,
 * goes back to the last value, so the value is never `NaN`. Escape throws
 * the typing away. Arrow Up and Arrow Down move by `step`, Page Up and Page
 * Down by `largeStep`, from the typed number when there is one.
 *
 * Other notations are a `parse` and `format` away: a timecode field is a
 * `NumberField` of seconds. With `name`, forms receive the number, not the
 * formatted text.
 *
 * @example
 * ```tsx
 * <Field label={messages.t("view.zoom")}>
 *   <NumberField
 *     min={10}
 *     max={400}
 *     step={10}
 *     value={zoom}
 *     onValueChange={setZoom}
 *     format={(percent) => `${percent}%`}
 *     parse={(text) => parseFloat(text)}
 *   />
 * </Field>
 * ```
 *
 * @public
 */
export const NumberField = /* @__PURE__ */ forwardRef<HTMLInputElement, NumberFieldProps>(
  function NumberField(
    {
      value: controlled,
      defaultValue,
      onValueChange,
      min,
      max,
      step = 1,
      largeStep,
      locale,
      parse,
      format,
      label,
      name,
      form,
      disabled,
      readOnly,
      className,
      classNames,
      unstyled,
      onBlur,
      onKeyDown,
      ...props
    },
    ref,
  ) {
    const lower = min ?? Number.NEGATIVE_INFINITY;
    const upper = max ?? Number.POSITIVE_INFINITY;
    const clamp = (n: number): number => Math.min(Math.max(n, lower), Math.max(lower, upper));

    const [uncontrolled, setUncontrolled] = useState(() => clamp(defaultValue ?? 0));
    // What's typed and not yet committed; null while the field shows the value.
    const [draft, setDraft] = useState<string | null>(null);
    // -0 would show as "-0".
    const value = clamp(controlled ?? uncontrolled) || 0;

    const contextLocale = useUiLocale();
    const resolvedLocale = locale ?? contextLocale;
    const notation = useMemo(() => notationOf(resolvedLocale), [resolvedLocale]);
    const places = Math.min(20, Math.max(decimals(step), decimals(value)));
    const formatter = useMemo(
      () => new Intl.NumberFormat(resolvedLocale, { maximumFractionDigits: places }),
      [resolvedLocale, places],
    );
    const formatted = format ? format(value) : formatter.format(value);
    const read = (text: string): number | undefined => {
      const parsed = parse ? parse(text) : parseIn(notation, text);
      return parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined;
    };

    const fieldProps = useFieldProps(props, label);
    if (
      label === undefined &&
      !props["aria-label"] &&
      !props["aria-labelledby"] &&
      fieldProps.id === undefined
    ) {
      if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
        warnInDevelopment(
          "NumberField needs an accessible name: pass label, or put it in a Field. Use text from your message catalogue.",
        );
      }
    }

    const commit = (next: number): void => {
      setDraft(null);
      const settled = clamp(next) || 0;
      if (settled === value) {
        return;
      }
      if (controlled === undefined) {
        setUncontrolled(settled);
      }
      onValueChange?.(settled);
    };

    // Commits typed text, or goes back to the value when it isn't a number.
    const commitDraft = (): void => {
      if (draft === null) {
        return;
      }
      const parsed = read(draft);
      if (parsed === undefined) {
        setDraft(null);
      } else {
        commit(parsed);
      }
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
      setDraft(event.currentTarget.value);
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement>): void => {
      commitDraft();
      onBlur?.(event);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
      onKeyDown?.(event);
      // An input method editor uses Enter and Escape while composing.
      if (event.defaultPrevented || event.nativeEvent.isComposing) {
        return;
      }
      if (event.key === "Enter") {
        // Not prevented, so Enter still submits a form. The commit renders
        // synchronously, so the form, and a parent's state, have the new
        // value first: Firefox submits before React's usual flush.
        flushSync(commitDraft);
        return;
      }
      if (event.key === "Escape") {
        if (draft !== null) {
          // Only the typing goes; a dialog around the field stays open.
          event.preventDefault();
          setDraft(null);
        }
        return;
      }
      if (readOnly || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      const large = largeStep ?? step * 10;
      const steps: Record<string, number> = {
        ArrowUp: step,
        ArrowDown: -step,
        PageUp: large,
        PageDown: -large,
      };
      const delta = steps[event.key];
      if (delta === undefined) {
        return;
      }
      event.preventDefault();
      const base = (draft === null ? undefined : read(draft)) ?? value;
      const precision = Math.max(
        decimals(base),
        decimals(delta),
        min === undefined ? 0 : decimals(min),
      );
      commit(roundTo(base + delta, precision));
    };

    return (
      <>
        <input
          {...props}
          {...fieldProps}
          ref={ref}
          type="text"
          role="spinbutton"
          inputMode={props.inputMode ?? (lower >= 0 ? "decimal" : "text")}
          autoComplete={props.autoComplete ?? "off"}
          autoCorrect={props.autoCorrect ?? "off"}
          spellCheck={props.spellCheck ?? false}
          disabled={disabled}
          readOnly={readOnly}
          value={draft ?? formatted}
          aria-label={label ?? props["aria-label"]}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={formatted}
          className={cx("hm-number-field", classNames?.root, className)}
          data-hm-unstyled={unstyledAttribute(unstyled)}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        {name === undefined ? null : (
          <input type="hidden" name={name} form={form} disabled={disabled} value={value} />
        )}
      </>
    );
  },
);
