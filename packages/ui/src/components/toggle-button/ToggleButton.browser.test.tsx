import { act, createRef, useState } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { cleanUp, loadStyles, mount } from "../../test/dom.js";
import { IconButton } from "../button/IconButton.js";
import { Toolbar } from "../toolbar/Toolbar.js";
import { ToggleButton } from "./ToggleButton.js";

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

const pressedOf = (button: Element | null | undefined): string | null | undefined =>
  button?.getAttribute("aria-pressed");

/** A controlled toggle in a toolbar, as a media player would use it. */
function Player() {
  const [loop, setLoop] = useState(false);
  return (
    <Toolbar label="Player">
      <IconButton label="Play" icon={<svg />} />
      <ToggleButton label="Loop" icon={<svg />} pressed={loop} onPressedChange={setLoop} />
      <ToggleButton label="Shuffle" icon={<svg />} />
    </Toolbar>
  );
}

describe("ToggleButton", () => {
  it("keeps its own state, toggled by a click, Enter and Space", async () => {
    const onPressedChange = vi.fn();
    const container = render(<ToggleButton onPressedChange={onPressedChange}>Loop</ToggleButton>);
    const button = container.querySelector("button") as HTMLButtonElement;
    await userEvent.click(button);
    expect(pressedOf(button)).toBe("true");
    button.focus();
    await userEvent.keyboard("{Enter}");
    expect(pressedOf(button)).toBe("false");
    await userEvent.keyboard(" ");
    expect(pressedOf(button)).toBe("true");
    expect(onPressedChange.mock.calls).toEqual([[true], [false], [true]]);
  });

  it("follows pressed when controlled, and only asks to change", async () => {
    const onPressedChange = vi.fn();
    const container = render(
      <ToggleButton pressed={false} onPressedChange={onPressedChange}>
        Loop
      </ToggleButton>,
    );
    const button = container.querySelector("button") as HTMLButtonElement;
    await userEvent.click(button);
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(pressedOf(button)).toBe("false");
  });

  it("keeps its label in both states", async () => {
    const container = render(<ToggleButton label="Loop" icon={<svg />} />);
    const button = container.querySelector("button") as HTMLButtonElement;
    await userEvent.click(button);
    expect(button.getAttribute("aria-label")).toBe("Loop");
    await userEvent.click(button);
    expect(button.getAttribute("aria-label")).toBe("Loop");
  });

  it("doesn't change when onClick prevents the default", async () => {
    const onPressedChange = vi.fn();
    const container = render(
      <ToggleButton onClick={(event) => event.preventDefault()} onPressedChange={onPressedChange}>
        Loop
      </ToggleButton>,
    );
    const button = container.querySelector("button") as HTMLButtonElement;
    await userEvent.click(button);
    expect(pressedOf(button)).toBe("false");
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it("doesn't change while disabled but focusable", async () => {
    const onPressedChange = vi.fn();
    const container = render(
      <ToggleButton disabled focusableWhenDisabled onPressedChange={onPressedChange}>
        Loop
      </ToggleButton>,
    );
    const button = container.querySelector("button") as HTMLButtonElement;
    button.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    // Playwright won't click an aria-disabled element, so dispatch the click.
    button.click();
    expect(pressedOf(button)).toBe("false");
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it("forwards its ref to the button element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<ToggleButton ref={ref}>Loop</ToggleButton>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("shows the on state with a border, not only a fill (WCAG 1.4.11)", () => {
    const container = render(
      <>
        <ToggleButton variant="quiet">Off</ToggleButton>
        <ToggleButton variant="quiet" defaultPressed>
          On
        </ToggleButton>
      </>,
    );
    const [off, on] = [...container.querySelectorAll("button")].map((b) => getComputedStyle(b));
    expect(off?.borderTopColor).toBe("rgba(0, 0, 0, 0)");
    expect(on?.borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(on?.borderTopStyle).toBe("solid");
  });

  it("lets the pressed border token restyle it", () => {
    const container = render(
      <div style={{ ["--hm-button-pressed-border-color" as string]: "rgb(255, 0, 0)" }}>
        <ToggleButton defaultPressed>Loop</ToggleButton>
      </div>,
    );
    expect(getComputedStyle(container.querySelector("button") as Element).borderTopColor).toBe(
      "rgb(255, 0, 0)",
    );
  });

  it("is square when it shows only an icon", () => {
    const container = render(<ToggleButton label="Loop" icon={<svg />} />);
    const box = (container.querySelector("button") as Element).getBoundingClientRect();
    expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(1);
  });

  it("is a toolbar item: arrow keys reach it, and Space or Enter toggles it", async () => {
    const container = render(<Player />);
    const [play, loop, shuffle] = [...container.querySelectorAll("button")];
    await userEvent.tab();
    expect(document.activeElement).toBe(play);
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(loop);
    await userEvent.keyboard(" ");
    expect(pressedOf(loop)).toBe("true");
    await userEvent.keyboard("{Enter}");
    expect(pressedOf(loop)).toBe("false");
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(shuffle);
    await userEvent.keyboard("{Enter}");
    expect(pressedOf(shuffle)).toBe("true");
    expect(pressedOf(loop)).toBe("false");
    // Still one Tab stop, on the last item focused.
    expect(
      [...container.querySelectorAll("button")].map((b) => b.getAttribute("tabindex")),
    ).toEqual(["-1", "-1", "0"]);
  });

  it("hydrates without errors or warnings", () => {
    const app = (
      <>
        <ToggleButton defaultPressed startIcon={<svg />}>
          Loop
        </ToggleButton>
        <ToggleButton label="Shuffle" icon={<svg />} disabled focusableWhenDisabled />
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
    const button = container.querySelector("button") as HTMLButtonElement;
    act(() => button.click());
    expect(pressedOf(button)).toBe("false");
  });
});
