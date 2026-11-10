import { type TokenCategory, type TokenDefinition, tokens } from "@hussmartinez/ui";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

/** The value a token resolves to here, under the current theme and density. */
function ResolvedValue({ name }: { name: string }) {
  const ref = useRef<HTMLElement>(null);
  const [value, setValue] = useState("");
  useLayoutEffect(() => {
    if (ref.current) {
      setValue(getComputedStyle(ref.current).getPropertyValue(`--hm-${name}`).trim());
    }
  }, [name]);
  return (
    <code ref={ref} className="hm-catalogue-code">
      {value}
    </code>
  );
}

export interface TokenTableProps {
  readonly title: string;
  readonly category: TokenCategory;
  readonly level?: TokenDefinition["level"];
  /** Renders a preview of the token, or nothing. */
  readonly preview?: (cssVar: string, definition: TokenDefinition) => ReactNode;
}

/** A table of one category's tokens, with their resolved values and a preview. */
export function TokenTable({ title, category, level = "semantic", preview }: TokenTableProps) {
  const rows = tokens.filter((t) => t.category === category && t.level === level);
  return (
    <section>
      <h2 className="hm-catalogue-title">{title}</h2>
      <table className="hm-catalogue-table">
        <thead>
          <tr>
            <th scope="col">Token</th>
            {preview ? <th scope="col">Preview</th> : null}
            <th scope="col">Value</th>
            <th scope="col">Purpose</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((definition) => (
            <tr key={definition.name}>
              <td>
                <code className="hm-catalogue-code">--hm-{definition.name}</code>
              </td>
              {preview ? <td>{preview(`var(--hm-${definition.name})`, definition)}</td> : null}
              <td>
                <ResolvedValue name={definition.name} />
              </td>
              <td className="hm-catalogue-muted">{definition.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
