import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { Button } from "../components/button/Button.js";
import { cleanUp, loadStyles, mount } from "../test/dom.js";
import { PlayIcon, RedoIcon, UndoIcon } from "./icons.generated.js";

let root: Root | undefined;

beforeEach(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  await loadStyles();
});
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  cleanUp();
});

function render(element: React.ReactElement): HTMLElement {
  const container = mount("");
  act(() => {
    root = createRoot(container);
    root.render(element);
  });
  return container;
}

const box = (element: Element | null) => (element as Element).getBoundingClientRect();

describe("icons", () => {
  it("size to --hm-icon-size, and follow a button's icon slot", () => {
    const container = render(
      <div style={{ ["--hm-icon-size" as string]: "40px" }}>
        <PlayIcon />
        <Button startIcon={<UndoIcon />} style={{ ["--hm-button-icon-size" as string]: "12px" }}>
          Undo
        </Button>
      </div>,
    );
    const [alone, inButton] = [...container.querySelectorAll("svg")];
    expect(box(alone ?? null).width).toBe(40);
    expect(box(alone ?? null).height).toBe(40);
    expect(box(inButton ?? null).width).toBe(12);
  });

  it("draw with the text colour", () => {
    const container = render(
      <span style={{ color: "rgb(255, 0, 0)" }}>
        <PlayIcon />
      </span>,
    );
    expect(getComputedStyle(container.querySelector("svg") as Element).stroke).toBe(
      "rgb(255, 0, 0)",
    );
  });

  it("mirror undo and redo in right-to-left text, and nothing else", () => {
    const container = render(
      <>
        <div dir="ltr">
          <UndoIcon />
        </div>
        <div dir="rtl">
          <UndoIcon />
          <RedoIcon />
          <PlayIcon />
        </div>
      </>,
    );
    const [ltrUndo, rtlUndo, rtlRedo, rtlPlay] = [...container.querySelectorAll("svg")].map(
      (svg) => getComputedStyle(svg).transform,
    );
    expect(ltrUndo).toBe("none");
    expect(rtlUndo).toBe("matrix(-1, 0, 0, 1, 0, 0)");
    expect(rtlRedo).toBe("matrix(-1, 0, 0, 1, 0, 0)");
    expect(rtlPlay).toBe("none");
  });

  it("are hidden from assistive technology unless labelled", async () => {
    render(
      <>
        <PlayIcon />
        <PlayIcon label="Playing" />
      </>,
    );
    await expect.element(page.getByRole("img", { name: "Playing" })).toBeInTheDocument();
    expect(page.getByRole("img").all()).toHaveLength(1);
  });
});
