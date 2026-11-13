import type { ShortcutPart } from "@hussmartinez/sdk-core";
import { act, createRef, useState } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { cleanUp, loadStyles, mount } from "../../test/dom.js";
import { Button } from "../button/Button.js";
import { IconButton } from "../button/IconButton.js";
import { Dialog } from "../dialog/Dialog.js";
import { Toolbar } from "../toolbar/Toolbar.js";
import { Tooltip } from "./Tooltip.js";

let root: Root | undefined;

beforeEach(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  await loadStyles();
  await parkPointer();
});

/**
 * Moves the real pointer to the page's corner. An earlier test's click leaves
 * it where the next test's trigger appears, which would hover it.
 */
async function parkPointer(): Promise<void> {
  const corner = document.createElement("div");
  corner.style.cssText = "position:fixed;top:0;left:0;width:2px;height:2px";
  document.body.append(corner);
  await userEvent.hover(corner);
  corner.remove();
}
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  cleanUp();
  vi.restoreAllMocks();
  delete (navigator as { userAgentData?: unknown }).userAgentData;
});

function render(element: React.ReactElement): HTMLElement {
  const container = mount("");
  act(() => {
    root = createRoot(container);
    root.render(element);
  });
  return container;
}

const tooltipOf = (container: ParentNode) => container.querySelector(".hm-tooltip") as HTMLElement;
const isOpen = (element: Element) => element.matches(":popover-open");
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** Lets timers and React settle. */
const settle = (ms = 0) => act(() => wait(ms));

const REDO_APPLE: readonly ShortcutPart[] = [
  { kind: "modifier", value: "Shift", message: "keys.apple.shift" },
  { kind: "modifier", value: "Meta", message: "keys.apple.meta" },
  { kind: "key", value: "Z" },
];

function Rotate({ delay = 30, placement }: { delay?: number; placement?: "top" | "bottom" }) {
  return (
    <div style={{ padding: "96px" }}>
      <Tooltip type="label" content="Rotate" delay={delay} placement={placement}>
        <IconButton label="Rotate" icon={<svg />} />
      </Tooltip>
      <Button>Elsewhere</Button>
    </div>
  );
}

/**
 * Moves keyboard focus to an element with Tab presses, as a person would.
 * It starts from a button at the very start of the page: in a fresh page,
 * Firefox's first Tab doesn't always land in the content.
 */
async function tabTo(target: Element): Promise<void> {
  const start = document.createElement("button");
  start.textContent = "Start";
  // Out of the flow, so adding and removing it never moves the content.
  start.style.cssText = "position:fixed;top:0;left:0";
  document.body.prepend(start);
  start.focus();
  try {
    for (let presses = 0; document.activeElement !== target && presses < 8; presses += 1) {
      await userEvent.tab();
    }
  } finally {
    start.remove();
  }
  expect(document.activeElement).toBe(target);
}

/** A stateful app around a tooltip, for the hydration test. */
function App() {
  const [count] = useState(0);
  return (
    <Tooltip type="label" content={`Rotate ${count}`}>
      <IconButton label={`Rotate ${count}`} icon={<svg />} />
    </Tooltip>
  );
}

describe("Tooltip", () => {
  it("shows at once on keyboard focus, above its trigger, and names it", async () => {
    const container = render(<Rotate />);
    const tooltip = tooltipOf(container);
    const trigger = container.querySelector("button") as HTMLElement;
    await tabTo(trigger);
    await expect.poll(() => isOpen(tooltip)).toBe(true);
    expect(tooltip.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      trigger.getBoundingClientRect().top,
    );
    expect(tooltip.dataset["hmPlacement"]).toBe("top");
    await expect.element(page.getByRole("button", { name: "Rotate" })).toBeInTheDocument();
    await userEvent.tab();
    await expect.poll(() => isOpen(tooltip)).toBe(false);
  });

  it("doesn't show for a mouse click's focus", async () => {
    const container = render(<Rotate delay={1000} />);
    const trigger = container.querySelector("button") as HTMLElement;
    await userEvent.click(trigger);
    await settle();
    expect(isOpen(tooltipOf(container))).toBe(false);
  });

  it("shows on hover after its delay, and stays while the pointer moves onto it", async () => {
    const container = render(<Rotate delay={60} />);
    const trigger = container.querySelector("button") as HTMLElement;
    const tooltip = tooltipOf(container);
    act(() => {
      trigger.dispatchEvent(
        new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }),
      );
      trigger.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    });
    await settle(10);
    expect(isOpen(tooltip)).toBe(false);
    await expect.poll(() => isOpen(tooltip)).toBe(true);
    // Hoverable (WCAG 1.4.13): leaving the trigger for the tooltip keeps it.
    act(() => {
      trigger.dispatchEvent(
        new PointerEvent("pointerout", { bubbles: true, pointerType: "mouse" }),
      );
      trigger.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
      tooltip.dispatchEvent(
        new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }),
      );
      tooltip.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    });
    await settle(200);
    expect(isOpen(tooltip)).toBe(true);
    act(() => {
      tooltip.dispatchEvent(
        new PointerEvent("pointerout", { bubbles: true, pointerType: "mouse" }),
      );
      tooltip.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
    });
    await settle(200);
    expect(isOpen(tooltip)).toBe(false);
  });

  it("doesn't show for touch", async () => {
    const container = render(<Rotate delay={0} />);
    const trigger = container.querySelector("button") as HTMLElement;
    act(() => {
      trigger.dispatchEvent(
        new PointerEvent("pointerover", { bubbles: true, pointerType: "touch" }),
      );
      trigger.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "touch" }));
    });
    await settle(50);
    expect(isOpen(tooltipOf(container))).toBe(false);
  });

  it("closes on Escape without moving focus, and without closing a surrounding dialog", async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open title="Export" onOpenChange={onOpenChange}>
        <Tooltip type="label" content="Rotate">
          <IconButton label="Rotate" icon={<svg />} />
        </Tooltip>
      </Dialog>,
    );
    const trigger = document.querySelector("dialog button[aria-labelledby]") as HTMLElement;
    const tooltip = document.querySelector("dialog .hm-tooltip") as HTMLElement;
    await tabTo(trigger);
    await expect.poll(() => isOpen(tooltip)).toBe(true);
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => isOpen(tooltip)).toBe(false);
    expect(onOpenChange).not.toHaveBeenCalled();
    // The next Escape belongs to the dialog.
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => onOpenChange.mock.calls).toEqual([[false]]);
  });

  it("shows below its trigger when there's no room above", async () => {
    const container = render(
      <Tooltip content="Rotates the page" delay={0}>
        <IconButton label="Rotate" icon={<svg />} />
      </Tooltip>,
    );
    const trigger = container.querySelector("button") as HTMLElement;
    container.style.position = "fixed";
    container.style.top = "0";
    await tabTo(trigger);
    const tooltip = tooltipOf(container);
    await expect.poll(() => tooltip.dataset["hmPlacement"]).toBe("bottom");
    expect(tooltip.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      trigger.getBoundingClientRect().bottom,
    );
  });

  it("works on a toolbar's focusable disabled buttons, following the arrow keys", async () => {
    const container = render(
      <div style={{ padding: "96px" }}>
        <Toolbar label="History">
          <Tooltip type="label" content="Undo">
            <IconButton label="Undo" icon={<svg />} disabled focusableWhenDisabled />
          </Tooltip>
          <Tooltip type="label" content="Redo">
            <IconButton label="Redo" icon={<svg />} />
          </Tooltip>
        </Toolbar>
      </div>,
    );
    const [undo, redo] = [...container.querySelectorAll(".hm-tooltip")] as HTMLElement[];
    await tabTo(container.querySelector("button") as Element);
    await expect.poll(() => isOpen(undo as Element)).toBe(true);
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => isOpen(undo as Element)).toBe(false);
    await expect.poll(() => isOpen(redo as Element)).toBe(true);
  });

  it("shows the shortcut in Apple's notation on Apple devices, and exposes it as aria-keyshortcuts", async () => {
    Object.defineProperty(navigator, "userAgentData", {
      value: { platform: "macOS" },
      configurable: true,
    });
    const container = render(
      <Tooltip type="label" content="Redo" shortcut={REDO_APPLE}>
        <IconButton label="Redo" icon={<svg />} />
      </Tooltip>,
    );
    const shortcut = container.querySelector(".hm-tooltip-shortcut") as HTMLElement;
    expect(shortcut.textContent).toBe("⇧⌘Z");
    expect(
      (container.querySelector("button") as HTMLElement).getAttribute("aria-keyshortcuts"),
    ).toBe("Shift+Meta+Z");
  });

  it("keeps the trigger's own ref and handlers, and forwards its ref to the tooltip", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const tooltipRef = createRef<HTMLDivElement>();
    const onFocus = vi.fn();
    render(
      <Tooltip ref={tooltipRef} content="Rotate">
        <IconButton ref={triggerRef} label="Rotate" icon={<svg />} onFocus={onFocus} />
      </Tooltip>,
    );
    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(tooltipRef.current?.getAttribute("role")).toBe("tooltip");
    await tabTo(triggerRef.current as Element);
    expect(onFocus).toHaveBeenCalled();
  });

  it("drops visual styles with unstyled", async () => {
    const container = render(
      <>
        <Tooltip content="A" delay={0}>
          <Button>A</Button>
        </Tooltip>
        <Tooltip content="B" delay={0} unstyled>
          <Button>B</Button>
        </Tooltip>
      </>,
    );
    const [styled, plain] = [...container.querySelectorAll(".hm-tooltip")].map((t) =>
      getComputedStyle(t),
    );
    expect(styled?.backgroundColor).not.toBe(plain?.backgroundColor);
  });

  it("hydrates without errors or warnings, and shows afterwards", async () => {
    const container = mount(renderToString(<App />));
    const consoleError = vi.spyOn(console, "error");
    const recoverable: unknown[] = [];
    act(() => {
      root = hydrateRoot(container, <App />, { onRecoverableError: (e) => recoverable.push(e) });
    });
    expect(recoverable).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    await tabTo(container.querySelector("button") as Element);
    await expect.poll(() => isOpen(tooltipOf(container))).toBe(true);
  });
});
