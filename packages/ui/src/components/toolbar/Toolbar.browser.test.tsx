import { act, useState } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { cleanUp, loadStyles, mount } from "../../test/dom.js";
import { Button } from "../button/Button.js";
import { SegmentedControl } from "../segmented-control/SegmentedControl.js";
import { Toolbar } from "./Toolbar.js";
import { ToolbarGroup } from "./ToolbarGroup.js";
import { ToolbarSeparator } from "./ToolbarSeparator.js";

let root: Root | undefined;

beforeEach(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  await loadStyles();
});
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  cleanUp();
  vi.restoreAllMocks();
});

function render(element: React.ReactElement, html = ""): HTMLElement {
  const container = mount(html);
  act(() => {
    if (html) {
      root = hydrateRoot(container, element);
    } else {
      root = createRoot(container);
      root.render(element);
    }
  });
  return container;
}

/** The elements a Tab key press can reach inside the toolbar. */
function tabStops(container: HTMLElement): Element[] {
  const toolbar = container.querySelector('[role="toolbar"]') as HTMLElement;
  return [...toolbar.querySelectorAll<HTMLElement>("button, [tabindex]")].filter(
    (element) => element.tabIndex >= 0 && !(element as HTMLButtonElement).disabled,
  );
}

const active = (): string => (document.activeElement as HTMLElement | null)?.textContent ?? "";

function Tools({ dir }: { dir?: "rtl" }) {
  return (
    <div dir={dir}>
      <Button>Before</Button>
      <Toolbar label="Page tools">
        <ToolbarGroup label="History">
          <Button>Undo</Button>
          <Button disabled>Redo</Button>
          <Button disabled focusableWhenDisabled>
            Repeat
          </Button>
        </ToolbarGroup>
        <ToolbarSeparator />
        <Button>Rotate</Button>
      </Toolbar>
      <Button>After</Button>
    </div>
  );
}

function Growing() {
  const [extra, setExtra] = useState(false);
  return (
    <Toolbar label="Tools">
      <Button onClick={() => setExtra(true)}>Add</Button>
      {extra ? <Button>Added</Button> : null}
    </Toolbar>
  );
}

function Toggle() {
  const [off, setOff] = useState(false);
  return (
    <Toolbar label="Tools">
      <Button onClick={() => setOff(true)}>Disable next</Button>
      <Button disabled={off}>Next</Button>
      <Button>Last</Button>
    </Toolbar>
  );
}

describe("Toolbar", () => {
  it("has exactly one Tab stop after hydration, and Tab leaves it", async () => {
    const container = render(<Tools />, renderToString(<Tools />));
    expect(tabStops(container).map((e) => e.textContent)).toEqual(["Undo"]);
    (container.querySelector("button") as HTMLElement).focus();
    await userEvent.tab();
    expect(active()).toBe("Undo");
    await userEvent.tab();
    expect(active()).toBe("After");
  });

  it("moves with arrow keys, wraps, and jumps with Home and End", async () => {
    render(<Tools />);
    await userEvent.tab();
    await userEvent.tab();
    expect(active()).toBe("Undo");
    await userEvent.keyboard("{ArrowRight}");
    expect(active()).toBe("Repeat"); // natively disabled Redo is skipped
    await userEvent.keyboard("{ArrowRight}");
    expect(active()).toBe("Rotate");
    await userEvent.keyboard("{ArrowRight}");
    expect(active()).toBe("Undo");
    await userEvent.keyboard("{ArrowLeft}");
    expect(active()).toBe("Rotate");
    await userEvent.keyboard("{Home}");
    expect(active()).toBe("Undo");
    await userEvent.keyboard("{End}");
    expect(active()).toBe("Rotate");
  });

  it("returns to the last focused item on Tab", async () => {
    const container = render(<Tools />);
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard("{End}");
    await userEvent.tab();
    expect(active()).toBe("After");
    await userEvent.tab({ shift: true });
    expect(active()).toBe("Rotate");
    expect(tabStops(container).map((e) => e.textContent)).toEqual(["Rotate"]);
  });

  it("reverses arrow keys in right-to-left text", async () => {
    render(<Tools dir="rtl" />);
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard("{ArrowLeft}");
    expect(active()).toBe("Repeat");
  });

  it("uses up and down in a vertical toolbar", async () => {
    render(
      <Toolbar label="Tools" orientation="vertical">
        <Button>One</Button>
        <Button>Two</Button>
      </Toolbar>,
    );
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    expect(active()).toBe("One");
    await userEvent.keyboard("{ArrowDown}");
    expect(active()).toBe("Two");
  });

  it("keeps one Tab stop when items are added later", async () => {
    const container = render(<Growing />);
    await userEvent.click(container.querySelector("button") as HTMLElement);
    await vi.waitFor(() => expect(container.querySelectorAll("button")).toHaveLength(2));
    await vi.waitFor(() => expect(tabStops(container).map((e) => e.textContent)).toEqual(["Add"]));
  });

  it("keeps custom tabindex items after making them non-stops, and leaves author-hidden ones out", async () => {
    const container = render(
      <Toolbar label="Format">
        {/* biome-ignore lint/a11y/useSemanticElements: a custom tabindex item is what this test is about. */}
        <div role="checkbox" aria-checked="false" aria-label="Bold" tabIndex={0}>
          B
        </div>
        <span tabIndex={-1}>Skipped</span>
        {/* biome-ignore lint/a11y/useSemanticElements: a custom tabindex item is what this test is about. */}
        <div role="checkbox" aria-checked="false" aria-label="Italic" tabIndex={0}>
          I
        </div>
        <Button>Clear</Button>
      </Toolbar>,
    );
    const label = (): string | null =>
      (document.activeElement as HTMLElement | null)?.getAttribute("aria-label") ??
      document.activeElement?.textContent ??
      null;
    await userEvent.tab();
    expect(label()).toBe("Bold");
    await userEvent.keyboard("{ArrowRight}");
    expect(label()).toBe("Italic");
    await userEvent.keyboard("{ArrowRight}");
    expect(label()).toBe("Clear");
    await userEvent.keyboard("{ArrowRight}");
    expect(label()).toBe("Bold");
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(label()).toBe("Italic");
    expect((container.querySelector("span") as HTMLElement).tabIndex).toBe(-1);
    expect(tabStops(container)).toHaveLength(1);
  });

  it("skips an item that becomes disabled after the toolbar managed it", async () => {
    render(<Toggle />);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{ArrowRight}");
    expect(active()).toBe("Last");
  });

  it("hydrates without errors or warnings", () => {
    const consoleError = vi.spyOn(console, "error");
    const recoverable: unknown[] = [];
    const container = mount(renderToString(<Tools />));
    act(() => {
      root = hydrateRoot(container, <Tools />, { onRecoverableError: (e) => recoverable.push(e) });
    });
    expect(recoverable).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
  });
});

function View({ inToolbar }: { inToolbar?: boolean }) {
  const [value, setValue] = useState<"single" | "double" | "grid" | "off">("double");
  const control = (
    <SegmentedControl
      label="View"
      value={value}
      onValueChange={setValue}
      options={[
        { value: "single", label: "Single" },
        { value: "double", label: "Double" },
        { value: "off", label: "Off", disabled: true },
        { value: "grid", label: "Grid" },
      ]}
    />
  );
  return inToolbar ? (
    <Toolbar label="Tools">
      <Button>Zoom</Button>
      {control}
    </Toolbar>
  ) : (
    control
  );
}

const checked = (container: HTMLElement): string | null | undefined =>
  container.querySelector('[aria-checked="true"]')?.textContent;

describe("SegmentedControl", () => {
  it("standalone, is one Tab stop on the selected option, and arrows move and select", async () => {
    const container = render(<View />);
    await userEvent.tab();
    expect(active()).toBe("Double");
    await userEvent.keyboard("{ArrowRight}");
    expect(active()).toBe("Grid"); // skips the disabled option
    expect(checked(container)).toBe("Grid");
    await userEvent.keyboard("{ArrowRight}");
    expect(checked(container)).toBe("Single"); // wraps
    await userEvent.keyboard("{ArrowUp}");
    expect(checked(container)).toBe("Grid");
    expect(
      [...container.querySelectorAll("button")]
        .filter((b) => b.tabIndex === 0)
        .map((b) => b.textContent),
    ).toEqual(["Grid"]);
  });

  it("selects on click", async () => {
    const container = render(<View />);
    await userEvent.click(container.querySelector('[data-hm-value="single"]') as HTMLElement);
    expect(checked(container)).toBe("Single");
  });

  it("inside a toolbar, joins its Tab stop: arrows move without selecting, Space and Enter select", async () => {
    const container = render(<View inToolbar />, renderToString(<View inToolbar />));
    expect(tabStops(container).map((e) => e.textContent)).toEqual(["Zoom"]);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    expect(active()).toBe("Single");
    expect(checked(container)).toBe("Double");
    await userEvent.keyboard(" ");
    expect(checked(container)).toBe("Single");
    // Arrows within the control move focus only; the selection stays.
    await userEvent.keyboard("{ArrowRight}");
    expect(active()).toBe("Double");
    expect(checked(container)).toBe("Single");
    await userEvent.keyboard("{ArrowRight}");
    expect(active()).toBe("Grid");
    expect(checked(container)).toBe("Single");
    // The control doesn't add a second Tab stop.
    expect(tabStops(container).map((e) => e.textContent)).toEqual(["Grid"]);
    await userEvent.keyboard("{Enter}");
    expect(checked(container)).toBe("Grid");
  });

  it("shows selection with a border as well as a colour (WCAG 1.4.11)", () => {
    const container = render(<View />);
    const selected = container.querySelector('[aria-checked="true"]') as Element;
    const other = container.querySelector('[aria-checked="false"]') as Element;
    expect(getComputedStyle(selected).borderTopColor).not.toBe(
      getComputedStyle(other).borderTopColor,
    );
  });

  it("hydrates without errors or warnings", () => {
    const consoleError = vi.spyOn(console, "error");
    const recoverable: unknown[] = [];
    const container = mount(renderToString(<View />));
    act(() => {
      root = hydrateRoot(container, <View />, { onRecoverableError: (e) => recoverable.push(e) });
    });
    expect(recoverable).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
