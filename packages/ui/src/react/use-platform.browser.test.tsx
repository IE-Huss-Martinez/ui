import { act } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanUp, mount } from "../test/dom.js";
import { usePlatform } from "./use-platform.js";

let root: Root | undefined;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  cleanUp();
  vi.restoreAllMocks();
  // Back to the browser's own value, from Navigator.prototype.
  delete (navigator as { userAgentData?: unknown }).userAgentData;
});

/** Makes this browser report a platform, as userAgentData does in Chromium. */
function pretend(platform: string): void {
  Object.defineProperty(navigator, "userAgentData", {
    value: { platform },
    configurable: true,
  });
}

function Label() {
  return <kbd>{usePlatform() === "apple" ? "⌘" : "Ctrl"}</kbd>;
}

describe("usePlatform", () => {
  it("hydrates as the other platform on a Mac, then switches to Apple's keys without a mismatch", () => {
    const html = renderToString(<Label />);
    expect(html).toBe("<kbd>Ctrl</kbd>");
    pretend("macOS");
    const container = mount(html);
    const consoleError = vi.spyOn(console, "error");
    const recoverable: unknown[] = [];
    act(() => {
      root = hydrateRoot(container, <Label />, {
        onRecoverableError: (error) => recoverable.push(error),
      });
    });
    expect(recoverable).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    expect(container.textContent).toBe("⌘");
  });

  it("stays on Control elsewhere", () => {
    pretend("Windows");
    const container = mount("");
    act(() => {
      root = createRoot(container);
      root.render(<Label />);
    });
    expect(container.textContent).toBe("Ctrl");
  });

  it("reads Apple's keys straight away in a client-only render", () => {
    pretend("macOS");
    const container = mount("");
    act(() => {
      root = createRoot(container);
      root.render(<Label />);
    });
    expect(container.textContent).toBe("⌘");
  });
});
