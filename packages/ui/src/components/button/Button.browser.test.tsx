import { act, createRef } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { cleanUp, loadStyles, mount } from "../../test/dom.js";
import { Button } from "./Button.js";
import { IconButton } from "./IconButton.js";

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

function render(element: React.ReactElement): HTMLElement {
  const container = mount("");
  act(() => {
    root = createRoot(container);
    root.render(element);
  });
  return container;
}

const px = (value: string): number => Number.parseFloat(value);

describe("Button", () => {
  it("activates with a click, Enter and Space", async () => {
    const onClick = vi.fn();
    const container = render(<Button onClick={onClick}>Save</Button>);
    const button = container.querySelector("button") as HTMLButtonElement;
    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("forwards its ref to the button element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Save</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("stays focusable but ignores activation when focusableWhenDisabled", async () => {
    const onClick = vi.fn();
    const container = render(
      <>
        <Button>Before</Button>
        <Button disabled focusableWhenDisabled onClick={onClick}>
          Undo
        </Button>
      </>,
    );
    const [before, undo] = [...container.querySelectorAll("button")] as HTMLButtonElement[];
    before?.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(undo);
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    // Playwright won't click an aria-disabled element, so dispatch the click.
    (undo as HTMLButtonElement).click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("meets the 24 px target size in every size", () => {
    const container = render(
      <>
        <Button size="small">S</Button>
        <IconButton size="small" label="Rotate" icon={<svg />} />
      </>,
    );
    for (const button of container.querySelectorAll("button")) {
      const box = button.getBoundingClientRect();
      expect(box.height).toBeGreaterThanOrEqual(24);
      expect(box.width).toBeGreaterThanOrEqual(24);
    }
  });

  it("shows the focus ring on keyboard focus", async () => {
    const container = render(<Button>Save</Button>);
    await userEvent.tab();
    const style = getComputedStyle(container.querySelector("button") as Element);
    expect(style.outlineStyle).toBe("solid");
    expect(px(style.outlineWidth)).toBeGreaterThanOrEqual(2);
  });

  it("drops visual styles but keeps layout and focus with unstyled", async () => {
    const container = render(
      <>
        <Button variant="primary">Styled</Button>
        <Button variant="primary" unstyled>
          Plain
        </Button>
      </>,
    );
    const [styled, plain] = [...container.querySelectorAll("button")] as HTMLButtonElement[];
    expect(getComputedStyle(styled as Element).backgroundColor).not.toBe(
      getComputedStyle(plain as Element).backgroundColor,
    );
    expect(getComputedStyle(plain as Element).display).toBe("inline-flex");
    expect((plain as Element).getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    (styled as HTMLElement).focus();
    await userEvent.tab();
    expect(getComputedStyle(plain as Element).outlineStyle).toBe("solid");
  });

  it("lets component tokens set on an ancestor restyle it", () => {
    const container = render(
      <div style={{ ["--hm-button-radius" as string]: "0px" }}>
        <Button>Square</Button>
      </div>,
    );
    expect(getComputedStyle(container.querySelector("button") as Element).borderRadius).toBe("0px");
  });

  it("hydrates without errors or warnings", () => {
    const app = (
      <>
        <Button variant="primary" pressed startIcon={<svg />}>
          Bold
        </Button>
        <IconButton label="Rotate" icon={<svg />} disabled focusableWhenDisabled />
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

describe("IconButton", () => {
  it("is named by its label", () => {
    const container = render(<IconButton label="Rotate" icon={<svg />} />);
    const button = container.querySelector("button") as HTMLButtonElement;
    expect(button.getAttribute("aria-label")).toBe("Rotate");
    expect(button.textContent).toBe("");
  });

  it("is square", () => {
    const container = render(<IconButton label="Rotate" icon={<svg />} />);
    const box = (container.querySelector("button") as Element).getBoundingClientRect();
    expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(1);
  });
});
