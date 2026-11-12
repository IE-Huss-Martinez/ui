import type { ReactElement, SVGProps } from "react";
import { cx } from "../components/shared/style-props.js";

/**
 * The shapes an icon is drawn with: an element name and its geometry. The
 * generator only ever writes the shapes and attributes its allowlist accepts.
 */
export type IconNode = readonly (readonly [
  "path" | "circle" | "rect" | "line" | "ellipse" | "polyline" | "polygon",
  Readonly<Record<string, string>>,
])[];

/**
 * Props of every icon. SVG attributes are passed through.
 *
 * @public
 */
export interface IconProps
  extends Omit<SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML" | "ref"> {
  /**
   * The accessible name, for an icon that means something on its own.
   * Without it, the icon is decorative and hidden from assistive
   * technology, as it should be inside a labelled button.
   */
  readonly label?: string | undefined;
}

/**
 * An icon from ui's set, such as `UndoIcon`.
 *
 * @public
 */
export type IconComponent = (props: IconProps) => ReactElement;

/**
 * Draws one icon. Each generated icon component calls it with its own name
 * and shapes; it's a plain function rather than a component factory, so every
 * icon is an ordinary module-level function that bundlers drop when unused.
 */
export function renderIcon(
  name: string,
  nodes: IconNode,
  mirror: boolean,
  { label, className, ...props }: IconProps,
): ReactElement {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx("hm-icon", className)}
      data-hm-icon={name}
      data-hm-mirror={mirror ? "" : undefined}
      focusable="false"
      role={label === undefined ? undefined : "img"}
      aria-label={label}
      aria-hidden={label === undefined ? true : undefined}
    >
      {nodes.map(([Shape, attributes], index) => (
        // The shapes never change order, so their index is a stable key.
        // biome-ignore lint/suspicious/noArrayIndexKey: static, ordered shapes
        <Shape key={index} {...attributes} />
      ))}
    </svg>
  );
}
