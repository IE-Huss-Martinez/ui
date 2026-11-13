import { type ChangeEvent, forwardRef, type InputHTMLAttributes } from "react";
import { warnInDevelopment } from "../../internal/development.js";
import { useFieldProps } from "../field/field-context.js";
import { cx, type StyleProps, unstyledAttribute } from "../shared/style-props.js";

declare const process: { readonly env: { readonly NODE_ENV?: string } };

/**
 * The kinds of single-line text a {@link TextField} takes.
 *
 * @public
 */
export type TextFieldType = "text" | "search" | "email" | "url" | "tel" | "password";

/**
 * Props of {@link TextField}. Native input props are passed through, so it
 * works controlled with `value` and `onChange`, or uncontrolled with
 * `defaultValue`.
 *
 * @public
 */
export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type">,
    StyleProps<"root"> {
  /** Defaults to `text`. */
  readonly type?: TextFieldType | undefined;
  /** Called with the new text as it changes, as well as `onChange`. */
  readonly onValueChange?: ((value: string) => void) | undefined;
  /**
   * The accessible name, such as "File name". Leave it out inside a
   * `Field`, or when a visible `<label>` points at the field's `id`, or
   * `aria-labelledby` names it.
   */
  readonly label?: string | undefined;
}

/**
 * A single-line text input, styled like the family's other fields. Inside a
 * `Field`, it takes the field's label, description and error.
 *
 * @example
 * ```tsx
 * <Field label={t("export.fileName")} error={nameError}>
 *   <TextField value={name} onValueChange={setName} autoComplete="off" />
 * </Field>
 * ```
 *
 * @public
 */
export const TextField = /* @__PURE__ */ forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    { type = "text", onValueChange, onChange, label, className, classNames, unstyled, ...props },
    ref,
  ) {
    const fieldProps = useFieldProps(props, label);
    if (
      label === undefined &&
      !props["aria-label"] &&
      !props["aria-labelledby"] &&
      fieldProps.id === undefined
    ) {
      if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
        warnInDevelopment(
          "TextField needs an accessible name: pass label, or put it in a Field. Use text from your message catalogue.",
        );
      }
    }

    const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
      onChange?.(event);
      onValueChange?.(event.currentTarget.value);
    };

    return (
      <input
        {...props}
        {...fieldProps}
        ref={ref}
        type={type}
        aria-label={label ?? props["aria-label"]}
        className={cx("hm-text-field", classNames?.root, className)}
        data-hm-unstyled={unstyledAttribute(unstyled)}
        onChange={handleChange}
      />
    );
  },
);
