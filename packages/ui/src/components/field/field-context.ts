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
 * invalid state unless the control sets its own.
 */
export function useFieldProps(own: OwnControlProps): OwnControlProps {
  const field = useFieldControl();
  if (!field) {
    return {
      id: own.id,
      "aria-describedby": own["aria-describedby"],
      "aria-invalid": own["aria-invalid"],
    };
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
