import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const REGISTRY = Symbol.for("@hussmartinez/ui");

afterEach(() => {
  vi.restoreAllMocks();
  delete (globalThis as Record<symbol, unknown>)[REGISTRY];
});

type ReactEntry = typeof import("../react.js");

/**
 * Renders with a fresh copy of ui's React entry while another copy, of version
 * 0.1.0, is already registered, and returns the warnings it printed.
 */
async function warningsFor(render: (ui: ReactEntry) => ReactElement): Promise<string[]> {
  (globalThis as Record<symbol, unknown>)[REGISTRY] = new Map([[{}, "0.1.0"]]);
  vi.resetModules();
  const ui = await import("../react.js");
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  renderToString(render(ui));
  return warn.mock.calls.map(([message]) => String(message));
}

const SECOND_COPY = /2 copies of @hussmartinez\/ui are in use \(0\.1\.0, /;

describe("the single-copy check in ui's components", () => {
  it.each([
    [
      "UiMessagesProvider",
      (ui: ReactEntry) => (
        <ui.UiMessagesProvider messages={{ locale: "en", t: () => "", error: () => "" } as never} />
      ),
    ],
    ["ThemeProvider", (ui: ReactEntry) => <ui.ThemeProvider mode="light" />],
    ["AnnouncerProvider", (ui: ReactEntry) => <ui.AnnouncerProvider />],
    ["a component with default text", (ui: ReactEntry) => <ui.Spinner />],
    [
      "a toolbar item",
      (ui: ReactEntry) => (
        <ui.Toolbar label="Tools">
          <ui.SegmentedControl
            label="View"
            value="a"
            onValueChange={() => undefined}
            options={[{ value: "a", label: "A" }]}
          />
        </ui.Toolbar>
      ),
    ],
    [
      "a field control",
      (ui: ReactEntry) => (
        <ui.Field label="Gain">
          <ui.Slider />
        </ui.Field>
      ),
    ],
  ])("warns through %s", async (_, render) => {
    expect(await warningsFor(render)).toEqual([expect.stringMatching(SECOND_COPY)]);
  });

  it("stays quiet for components that use no context", async () => {
    expect(await warningsFor((ui) => <ui.Button>Save</ui.Button>)).toEqual([]);
  });
});
