import { act, createRef, useState } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { cleanUp, loadStyles, mount } from "../../test/dom.js";
import { IconButton } from "../button/IconButton.js";
import { Toolbar } from "../toolbar/Toolbar.js";
import { Slider, type SliderProps } from "./Slider.js";

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

function renderSlider(props: SliderProps = {}): HTMLInputElement {
  const container = render(<Slider label="Volume" {...props} />);
  const input = container.querySelector("input") as HTMLInputElement;
  input.focus();
  return input;
}

/** Presses each key and records the value after it. */
async function press(input: HTMLInputElement, keys: string[]): Promise<string[]> {
  const values: string[] = [];
  for (const key of keys) {
    await userEvent.keyboard(key);
    values.push(input.value);
  }
  return values;
}

function Gain() {
  const [gain, setGain] = useState(-6);
  return (
    <Slider
      label="Gain"
      min={-60}
      max={0}
      value={gain}
      onValueChange={setGain}
      formatValue={(db) => `${db} dB`}
    />
  );
}

describe("Slider", () => {
  it("is a slider to assistive technology, named by its label", () => {
    const input = renderSlider();
    expect(input.type).toBe("range");
    expect(input.getAttribute("aria-label")).toBe("Volume");
  });

  it("moves by step with the arrow keys, and to the ends with Home and End", async () => {
    const input = renderSlider({ defaultValue: 50 });
    expect(
      await press(input, [
        "{ArrowRight}",
        "{ArrowUp}",
        "{ArrowLeft}",
        "{ArrowDown}",
        "{End}",
        "{Home}",
      ]),
    ).toEqual(["51", "52", "51", "50", "100", "0"]);
  });

  it("moves by a tenth of the range with Page Up and Page Down, or by largeStep", async () => {
    const input = renderSlider({ defaultValue: 50 });
    expect(await press(input, ["{PageUp}", "{PageDown}", "{PageDown}"])).toEqual([
      "60",
      "50",
      "40",
    ]);
    act(() => root?.unmount());
    const custom = renderSlider({ defaultValue: 50, largeStep: 25 });
    expect(await press(custom, ["{PageUp}", "{PageUp}"])).toEqual(["75", "100"]);
  });

  it("rounds the default large step to whole steps", async () => {
    const input = renderSlider({ min: 0, max: 48, step: 4, defaultValue: 0 });
    // A tenth of 48 is 4.8, so Page Up moves one step of 4.
    expect(await press(input, ["{PageUp}"])).toEqual(["4"]);
  });

  it("steps by decimals without drifting", async () => {
    const input = renderSlider({ min: 0, max: 1, step: 0.1, defaultValue: 0 });
    expect(await press(input, ["{ArrowUp}", "{ArrowUp}", "{ArrowUp}"])).toEqual([
      "0.1",
      "0.2",
      "0.3",
    ]);
  });

  it("reaches max with End and the arrow keys, with a decimal step", async () => {
    const input = renderSlider({ min: 0, max: 0.3, step: 0.1, defaultValue: 0 });
    expect(await press(input, ["{End}", "{Home}", "{ArrowUp}", "{ArrowUp}", "{ArrowUp}"])).toEqual([
      "0.3",
      "0",
      "0.1",
      "0.2",
      "0.3",
    ]);
  });

  it("stops at the ends without calling onValueChange", async () => {
    const onValueChange = vi.fn();
    const input = renderSlider({ defaultValue: 100, onValueChange });
    expect(await press(input, ["{ArrowRight}", "{PageUp}", "{End}"])).toEqual([
      "100",
      "100",
      "100",
    ]);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("mirrors the arrow keys in right-to-left text, in every engine", async () => {
    const container = render(
      <div dir="rtl">
        <Slider label="Volume" defaultValue={50} />
      </div>,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    input.focus();
    expect(await press(input, ["{ArrowRight}", "{ArrowLeft}", "{ArrowLeft}", "{ArrowUp}"])).toEqual(
      ["49", "50", "51", "52"],
    );
  });

  it("follows the pointer, mirrored in right-to-left text", async () => {
    for (const dir of ["ltr", "rtl"] as const) {
      const onValueChange = vi.fn();
      const container = render(
        <div dir={dir} style={{ inlineSize: "300px" }}>
          <Slider label="Volume" defaultValue={50} onValueChange={onValueChange} />
        </div>,
      );
      const input = container.querySelector("input") as HTMLInputElement;
      const { height } = input.getBoundingClientRect();
      await userEvent.click(input, { position: { x: 2, y: height / 2 } });
      const value = Number(input.value);
      expect(onValueChange).toHaveBeenCalledWith(value);
      if (dir === "ltr") {
        expect(value).toBeLessThan(10);
      } else {
        expect(value).toBeGreaterThan(90);
      }
      act(() => root?.unmount());
      cleanUp();
    }
  });

  it("reads the value as formatValue's text, as it changes", async () => {
    const container = render(<Gain />);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.getAttribute("aria-valuetext")).toBe("-6 dB");
    input.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(input.getAttribute("aria-valuetext")).toBe("-5 dB");
  });

  it("only asks to change when controlled", async () => {
    const onValueChange = vi.fn();
    const input = renderSlider({ value: 50, onValueChange });
    await userEvent.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenCalledWith(51);
    expect(input.value).toBe("50");
  });

  it("leaves keys alone when onKeyDown prevents the default", async () => {
    const onValueChange = vi.fn();
    const input = renderSlider({
      defaultValue: 50,
      onValueChange,
      onKeyDown: (event) => {
        if (event.key === "ArrowUp") {
          event.preventDefault();
        }
      },
    });
    await userEvent.keyboard("{ArrowUp}");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input.value).toBe("50");
  });

  it("moves the same with Shift or Control held", async () => {
    const input = renderSlider({ defaultValue: 50 });
    expect(
      await press(input, ["{Shift>}{ArrowRight}{/Shift}", "{Control>}{ArrowRight}{/Control}"]),
    ).toEqual(["51", "52"]);
  });

  it("keeps its keys inside a toolbar, which still has one Tab stop", async () => {
    const container = render(
      <Toolbar label="Player">
        <IconButton label="Play" icon={<svg />} />
        <Slider label="Volume" defaultValue={50} />
      </Toolbar>,
    );
    const play = container.querySelector("button");
    const input = container.querySelector("input") as HTMLInputElement;
    await userEvent.tab();
    expect(document.activeElement).toBe(play);
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(input);
    expect(
      await press(input, ["{ArrowRight}", "{ArrowLeft}", "{ArrowLeft}", "{End}", "{Home}"]),
    ).toEqual(["51", "50", "49", "100", "0"]);
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("tabindex")).toBe("0");
    expect(play?.getAttribute("tabindex")).toBe("-1");
  });

  it("submits its value with a form", () => {
    const container = render(
      <form>
        <Slider label="Volume" name="volume" defaultValue={30} />
      </form>,
    );
    const form = container.querySelector("form") as HTMLFormElement;
    expect(new FormData(form).get("volume")).toBe("30");
  });

  it("forwards its ref to the input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Slider label="Volume" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("meets the target size, and keeps it unstyled", () => {
    const container = render(
      <>
        <Slider label="Styled" />
        <Slider label="Plain" unstyled />
      </>,
    );
    for (const input of container.querySelectorAll("input")) {
      expect(input.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    }
  });

  it("drops visual styles but keeps the focus ring with unstyled", async () => {
    const container = render(
      <>
        <Slider label="Styled" />
        <Slider label="Plain" unstyled />
      </>,
    );
    const [styled, plain] = [...container.querySelectorAll("input")];
    expect(getComputedStyle(styled as Element).appearance).toBe("none");
    expect(getComputedStyle(plain as Element).appearance).not.toBe("none");
    (styled as HTMLElement).focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(plain);
    expect(getComputedStyle(plain as Element).outlineStyle).toBe("solid");
  });

  it("hydrates without errors or warnings", async () => {
    const app = <Gain />;
    const container = mount(renderToString(app));
    const consoleError = vi.spyOn(console, "error");
    const recoverable: unknown[] = [];
    act(() => {
      root = hydrateRoot(container, app, { onRecoverableError: (e) => recoverable.push(e) });
    });
    expect(recoverable).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    const input = container.querySelector("input") as HTMLInputElement;
    input.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(input.getAttribute("aria-valuetext")).toBe("-7 dB");
  });
});
