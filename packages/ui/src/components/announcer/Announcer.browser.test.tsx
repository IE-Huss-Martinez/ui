import { act } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanUp, loadStyles, mount } from "../../test/dom.js";
import { type Announce, AnnouncerProvider, useAnnounce } from "./Announcer.js";

let root: Root | undefined;
let announce: Announce = () => undefined;

function Capture() {
  announce = useAnnounce();
  return null;
}

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

function render(): HTMLElement {
  const container = mount("");
  act(() => {
    root = createRoot(container);
    root.render(
      <AnnouncerProvider>
        <Capture />
      </AnnouncerProvider>,
    );
  });
  return container;
}

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));

async function settle(): Promise<void> {
  await act(async () => {
    await nextFrame();
    await nextFrame();
  });
}

describe("AnnouncerProvider", () => {
  it("puts polite messages in the status region and assertive ones in the alert region", async () => {
    const container = render();
    act(() => announce("Saved 1.3 MB"));
    await settle();
    expect(container.querySelector('[role="status"]')?.textContent).toBe("Saved 1.3 MB");
    act(() => announce("Export failed", { politeness: "assertive" }));
    await settle();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe("Export failed");
    expect(container.querySelector('[role="status"]')?.textContent).toBe("Saved 1.3 MB");
  });

  it("empties the region before repeating a message, so it's announced again", async () => {
    const container = render();
    const status = container.querySelector('[role="status"]') as Element;
    act(() => announce("Saved"));
    await settle();
    const texts: string[] = [];
    const observer = new MutationObserver(() => texts.push(status.textContent ?? ""));
    observer.observe(status, { childList: true, characterData: true, subtree: true });
    act(() => announce("Saved"));
    await settle();
    observer.disconnect();
    expect(texts).toContain("");
    expect(texts.at(-1)).toBe("Saved");
  });

  it("announces only the latest of messages sent in the same frame", async () => {
    const container = render();
    const status = container.querySelector('[role="status"]') as Element;
    const texts: string[] = [];
    const observer = new MutationObserver(() => texts.push(status.textContent ?? ""));
    observer.observe(status, { childList: true, characterData: true, subtree: true });
    act(() => {
      announce("One");
      announce("Two");
    });
    await settle();
    observer.disconnect();
    expect(texts).not.toContain("One");
    expect(status.textContent).toBe("Two");
  });

  it("keeps its regions hidden on screen but in the accessibility tree", () => {
    const container = render();
    const regions = container.querySelector(".hm-announcer") as Element;
    expect(regions.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    expect(getComputedStyle(regions).display).not.toBe("none");
  });

  it("hydrates without errors or warnings", () => {
    const app = (
      <AnnouncerProvider>
        <p>Content</p>
      </AnnouncerProvider>
    );
    const container = mount(renderToString(app));
    const consoleError = vi.spyOn(console, "error");
    const recoverable: unknown[] = [];
    act(() => {
      root = hydrateRoot(container, app, { onRecoverableError: (e) => recoverable.push(e) });
    });
    expect(recoverable).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
