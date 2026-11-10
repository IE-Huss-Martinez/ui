import { act } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
import { cleanUp, loadStyles, mount } from "../../test/dom.js";
import { ProgressBar } from "../progress-bar/ProgressBar.js";
import { Spinner } from "./Spinner.js";

let root: Root | undefined;

beforeEach(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  await commands.setReducedMotion(false);
  await loadStyles();
});
afterEach(async () => {
  act(() => root?.unmount());
  root = undefined;
  cleanUp();
  vi.restoreAllMocks();
  await commands.setReducedMotion(false);
});

function render(element: React.ReactElement): HTMLElement {
  const container = mount("");
  act(() => {
    root = createRoot(container);
    root.render(element);
  });
  return container;
}

describe("Spinner", () => {
  it("turns, and pulses instead under reduced motion", async () => {
    const container = render(<Spinner />);
    const spinner = container.querySelector(".hm-spinner") as Element;
    expect(getComputedStyle(spinner).animationName).toBe("hm-spinner-turn");
    await commands.setReducedMotion(true);
    expect(getComputedStyle(spinner).animationName).toBe("hm-spinner-pulse");
  });

  it("takes its size from --hm-spinner-size", () => {
    const container = render(
      <div style={{ ["--hm-spinner-size" as string]: "40px" }}>
        <Spinner />
      </div>,
    );
    const box = (container.querySelector(".hm-spinner") as Element).getBoundingClientRect();
    expect(box.width).toBe(40);
    expect(box.height).toBe(40);
  });

  it("has no animation when unstyled", () => {
    const container = render(<Spinner unstyled />);
    expect(getComputedStyle(container.querySelector(".hm-spinner") as Element).animationName).toBe(
      "none",
    );
  });
});

describe("ProgressBar", () => {
  it("reports its value natively, and is indeterminate without one", () => {
    const container = render(
      <>
        <ProgressBar value={25} />
        <ProgressBar />
      </>,
    );
    const [known, unknown] = [...container.querySelectorAll("progress")];
    expect((known as HTMLProgressElement).position).toBe(0.25);
    expect((known as Element).matches(":indeterminate")).toBe(false);
    expect((unknown as Element).matches(":indeterminate")).toBe(true);
  });

  it("pulses while indeterminate, and stays still under reduced motion", async () => {
    const container = render(<ProgressBar />);
    const bar = container.querySelector("progress") as Element;
    expect(getComputedStyle(bar).animationName).toBe("hm-progress-pulse");
    await commands.setReducedMotion(true);
    expect(getComputedStyle(bar).animationName).toBe("none");
  });

  it("fills the width it's given, at the track height", () => {
    const container = render(
      <div style={{ inlineSize: "300px" }}>
        <ProgressBar value={50} />
      </div>,
    );
    const box = (container.querySelector("progress") as Element).getBoundingClientRect();
    expect(box.width).toBe(300);
    expect(box.height).toBe(6);
  });
});

describe("Spinner and ProgressBar", () => {
  it("hydrate without errors or warnings", () => {
    const app = (
      <>
        <Spinner />
        <ProgressBar value={10} />
      </>
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
