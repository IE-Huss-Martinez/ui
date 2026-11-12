import { createContext, useContext } from "react";
import { warnInDevelopment } from "../../internal/development.js";

/**
 * The props a {@link Field} gives its control, so the label, description
 * and error reach assistive technology.
 *
 * @public
 */
export interface FieldControlProps {
  /** The control's `id`, which the label points at. */
  readonly id: string;
  /** The ids of the description and the error, when there are any. */
  readonly "aria-describedby": string | undefined;
  /** `true` while the field shows an error. */
  readonly "aria-invalid": true | undefined;
}

export const FieldContext = /* @__PURE__ */ createContext<FieldControlProps | undefined>(undefined);

/** The enclosing field's control props, or `undefined` outside a field. */
export function useFieldControl(): FieldControlProps | undefined {
  return useContext(FieldContext);
}

/** Joins `aria-describedby` id lists, skipping empty ones. */
export function joinIds(...ids: (string | undefined)[]): string | undefined {
  const joined = ids.filter(Boolean).join(" ");
  return joined === "" ? undefined : joined;
}

/** The props a control already has that a field adds to. */
interface OwnControlProps {
  readonly id?: string | undefined;
  readonly "aria-describedby"?: string | undefined;
  readonly "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling" | undefined;
}

/**
 * Merges the enclosing field's props into a control's own: the field's id
 * unless the control has one, both description lists, and the field's
 * invalid state unless the control sets its own. Inside a field, it warns in
 * development about a control's own `label` or `aria-label`, and its own id.
 */
export function useFieldProps(
  own: OwnControlProps & { readonly "aria-label"?: string | undefined },
  label?: string,
): OwnControlProps {
  const field = useFieldControl();
  if (!field) {
    return {
      id: own.id,
      "aria-describedby": own["aria-describedby"],
      "aria-invalid": own["aria-invalid"],
    };
  }
  // An aria-label replaces the visible label's text as the name, which
  // breaks WCAG 2.5.3, Label in Name, when the two differ.
  if (label !== undefined || own["aria-label"] !== undefined) {
    warnInDevelopment(
      "A control inside Field has its own label or aria-label, which replaces the field's visible label for screen readers. Leave it out, and set Field's label instead.",
    );
  }
  if (own.id !== undefined && own.id !== field.id) {
    warnInDevelopment(
      "A control inside Field has its own id, so the field's label doesn't point at it. Pass the id to Field's controlId instead.",
    );
  }
  return {
    id: own.id ?? field.id,
    "aria-describedby": joinIds(field["aria-describedby"], own["aria-describedby"]),
    "aria-invalid": own["aria-invalid"] ?? field["aria-invalid"],
  };
}
