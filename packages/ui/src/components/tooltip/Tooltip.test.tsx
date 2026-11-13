import type { ShortcutPart } from "@hussmartinez/sdk-core";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IconButton } from "../button/IconButton.js";
import { Tooltip } from "./Tooltip.js";

afterEach(() => {
  vi.restoreAllMocks();
});

/** What sdk-core's registry.describe returns for Mod+Shift+Z on each platform. */
const REDO: Record<"apple" | "other", readonly ShortcutPart[]> = {
  apple: [
    { kind: "modifier", value: "Shift", message: "keys.apple.shift" },
    { kind: "modifier", value: "Meta", message: "keys.apple.meta" },
    { kind: "key", value: "Z" },
  ],
  other: [
    { kind: "modifier", value: "Control", message: "keys.control" },
    { kind: "modifier", value: "Shift", message: "keys.shift" },
    { kind: "key", value: "Z" },
  ],
};

const attribute = (html: string, tag: string, name: string) =>
  new RegExp(`<${tag}\\b[^>]*\\s${name}="([^"]*)"`).exec(html)?.[1];

describe("Tooltip on the server", () => {
  it("describes its trigger with a hidden top-layer tooltip", () => {
    const html = renderToString(
      <Tooltip content="Rotates the page">
        <IconButton label="Rotate" icon={<svg />} />
      </Tooltip>,
    );
    const contentId = /<span id="([^"]+)" class="hm-tooltip-content">Rotates the page<\/span>/.exec(
      html,
    )?.[1];
    expect(contentId).toBeTruthy();
    expect(attribute(html, "button", "aria-describedby")).toBe(contentId);
    expect(attribute(html, "button", "aria-label")).toBe("Rotate");
    expect(html).toMatch(/<div id="[^"]+" role="tooltip" popover="manual" class="hm-tooltip">/);
  });

  it("names an icon-only trigger with type label, after any name it already points to", () => {
    const html = renderToString(
      <Tooltip type="label" content="Rotate">
        <IconButton label="Rotate" icon={<svg />} aria-describedby="hint" />
      </Tooltip>,
    );
    const contentId = /<span id="([^"]+)" class="hm-tooltip-content">/.exec(html)?.[1];
    expect(attribute(html, "button", "aria-labelledby")).toBe(contentId);
    expect(attribute(html, "button", "aria-describedby")).toBe("hint");
  });

  it("keeps the trigger's own descriptions", () => {
    const html = renderToString(
      <Tooltip content="More">
        <IconButton label="Rotate" icon={<svg />} aria-describedby="hint" />
      </Tooltip>,
    );
    expect(attribute(html, "button", "aria-describedby")?.split(" ")[0]).toBe("hint");
  });

  it("gives the trigger aria-keyshortcuts, and shows the shortcut in the other platform's notation", () => {
    const html = renderToString(
      <Tooltip content="Redo" shortcut={REDO.other}>
        <IconButton label="Redo" icon={<svg />} />
      </Tooltip>,
    );
    expect(attribute(html, "button", "aria-keyshortcuts")).toBe("Control+Shift+Z");
    const shortcut =
      /<span class="hm-tooltip-shortcut" aria-hidden="true">(.*?)<\/span><\/div>/.exec(html)?.[1] ??
      "";
    expect(shortcut.replace(/<[^>]+>/g, "")).toBe("Ctrl+Shift+Z");
  });

  it("adds className and classNames, and marks unstyled", () => {
    const html = renderToString(
      <Tooltip
        content="Redo"
        shortcut={REDO.other}
        className="app"
        classNames={{ root: "root", content: "content", shortcut: "shortcut" }}
        unstyled
      >
        <IconButton label="Redo" icon={<svg />} />
      </Tooltip>,
    );
    expect(html).toContain('class="hm-tooltip root app"');
    expect(html).toContain('data-hm-unstyled=""');
    expect(html).toContain('class="hm-tooltip-content content"');
    expect(html).toContain('class="hm-tooltip-shortcut shortcut"');
  });

  it("warns in development when its child isn't one element", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderToString(<Tooltip content="Redo">{"text" as never}</Tooltip>);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/Tooltip needs one element/));
  });
});
