import { forwardRef, type HTMLAttributes, type ReactNode, useId } from "react";
import { cx, type StyleProps, unstyledAttribute } from "../shared/style-props.js";
import { FieldContext, type FieldControlProps, joinIds } from "./field-context.js";

/**
 * The parts of a field that `classNames` can target.
 *
 * @public
 */
export type FieldPart = "root" | "label" | "description" | "error";

/**
 * Props of {@link Field}. Native `div` props are passed through to the root.
 *
 * @public
 */
export interface FieldProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">,
    StyleProps<FieldPart> {
  /** The visible label. Use text from your message catalogue. */
  readonly label: ReactNode;
  /** Help shown under the label, such as "Between −24 and 24 dB". */
  readonly description?: ReactNode;
  /**
   * What's wrong with the value, such as "Enter a number". While it's set,
   * the control is marked invalid and the text is read with it.
   */
  readonly error?: ReactNode;
  /** The control's `id`. Defaults to a generated one. */
  readonly controlId?: string | undefined;
  /**
   * The control. `ui` controls, such as `Slider` and `NumberField`, connect
   * themselves. For any other control, pass a function and spread the
   * props it receives onto the control.
   */
  readonly children: ReactNode | ((control: FieldControlProps) => ReactNode);
}

/**
 * A label, an optional description and an optional error, wired to one
 * control: the label names it, and the description and error describe it.
 *
 * The control must be labelable, such as an `<input>`, `<select>`,
 * `<textarea>` or `ui`'s `Slider`. For a group of controls, such as
 * `SegmentedControl`, use the group's own `label`.
 *
 * An error that appears after the user acts, such as on submit, isn't
 * announced on its own: move focus to the field, or announce it with
 * `useAnnounce`.
 *
 * @example
 * ```tsx
 * <Field label={t("export.dpi")} description={t("export.dpiHelp")} error={dpiError}>
 *   <Slider min={72} max={600} value={dpi} onValueChange={setDpi} />
 * </Field>
 *
 * <Field label={t("export.name")}>
 *   {(control) => <input {...control} value={name} onChange={onNameChange} />}
 * </Field>
 * ```
 *
 * @public
 */
export const Field = /* @__PURE__ */ forwardRef<HTMLDivElement, FieldProps>(function Field(
  { label, description, error, controlId, className, classNames, unstyled, children, ...props },
  ref,
) {
  const generated = useId();
  const id = controlId ?? `${generated}-control`;
  const descriptionId = `${generated}-description`;
  const errorId = `${generated}-error`;
  const hasDescription = description != null && description !== false;
  const hasError = error != null && error !== false;
  const control: FieldControlProps = {
    id,
    "aria-describedby": joinIds(
      hasDescription ? descriptionId : undefined,
      hasError ? errorId : undefined,
    ),
    "aria-invalid": hasError ? true : undefined,
  };

  return (
    <div
      {...props}
      ref={ref}
      className={cx("hm-field", classNames?.root, className)}
      data-hm-unstyled={unstyledAttribute(unstyled)}
    >
      <label htmlFor={id} className={cx("hm-field-label", classNames?.label)}>
        {label}
      </label>
      {hasDescription ? (
        <div id={descriptionId} className={cx("hm-field-description", classNames?.description)}>
          {description}
        </div>
      ) : null}
      <FieldContext.Provider value={control}>
        {typeof children === "function" ? children(control) : children}
      </FieldContext.Provider>
      {hasError ? (
        <div id={errorId} className={cx("hm-field-error", classNames?.error)}>
          {error}
        </div>
      ) : null}
    </div>
  );
});
