import type { ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { IconProps } from "./create-icon.js";
import * as icons from "./icons.generated.js";
import { iconManifest } from "./manifest.js";

const { PlayIcon, UndoIcon } = icons;

describe("icons on the server", () => {
  it("render a decorative, currentColor SVG with the hm-icon class", () => {
    const html = renderToString(<PlayIcon />);
    expect(html).toMatch(/^<svg [^>]*>.*<\/svg>$/);
    for (const attribute of [
      'class="hm-icon"',
      'viewBox="0 0 24 24"',
      'fill="none"',
      'stroke="currentColor"',
      'stroke-width="2"',
      'stroke-linecap="round"',
      'stroke-linejoin="round"',
      'data-hm-icon="play"',
      'focusable="false"',
      'aria-hidden="true"',
    ]) {
      expect(html).toContain(attribute);
    }
    expect(html).not.toContain("role=");
    expect(html).not.toContain("data-hm-mirror");
  });

  it("mark the icons that mirror in right-to-left text", () => {
    expect(renderToString(<UndoIcon />)).toContain('data-hm-mirror=""');
  });

  it("become a named image with a label", () => {
    const html = renderToString(<PlayIcon label="Playing" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Playing"');
    expect(html).not.toContain("aria-hidden");
  });

  it("add className and pass SVG attributes through", () => {
    const html = renderToString(<PlayIcon className="app" data-testid="play" />);
    expect(html).toContain('class="hm-icon app"');
    expect(html).toContain('data-testid="play"');
  });

  it("render every icon in the manifest, each with its own shapes", () => {
    const components = Object.entries(icons).filter(([name]) => name.endsWith("Icon"));
    expect(components).toHaveLength(Object.keys(iconManifest).length);
    const drawings = new Set<string>();
    for (const [name, Icon] of components) {
      const html = renderToString(
        (() => {
          const Component = Icon as ComponentType<IconProps>;
          return <Component />;
        })(),
      );
      expect(html, name).toMatch(/<(path|circle|rect|line|ellipse|polyline|polygon) /);
      drawings.add(html.replace(/data-hm-icon="[^"]*"/, ""));
    }
    expect(drawings.size).toBe(components.length);
  });
});
