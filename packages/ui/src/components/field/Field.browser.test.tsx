import { act, createRef, useState } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { cleanUp, loadStyles, mount } from "../../test/dom.js";
import { Slider } from "../slider/Slider.js";
import { Field } from "./Field.js";

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

/** A field whose error comes and goes with its value, as validation would. */
function Validated() {
  const [gain, setGain] = useState(0);
  return (
    <Field
      label="Gain"
      description="Between −24 and 24 dB"
      error={gain > 6 ? "Above 6 dB, the export may clip" : undefined}
    >
      <Slider min={-24} max={24} value={gain} onValueChange={setGain} />
    </Field>
  );
}

describe("Field", () => {
  it("names a ui control with its label, and describes it", async () => {
    render(
      <Field label="Gain" description="Between −24 and 24 dB">
        <Slider min={-24} max={24} />
      </Field>,
    );
    const slider = page.getByRole("slider", { name: "Gain" });
    await expect.element(slider).toBeInTheDocument();
    await expect.element(slider).toHaveAccessibleDescription("Between −24 and 24 dB");
  });

  it("names and describes a native control through function children", async () => {
    render(
      <Field label="File name" description="Without the extension" error="Enter a name">
        {(control) => <input {...control} />}
      </Field>,
    );
    const input = page.getByRole("textbox", { name: "File name" });
    await expect.element(input).toHaveAccessibleDescription("Without the extension Enter a name");
    await expect.element(input).toHaveAttribute("aria-invalid", "true");
  });

  it("marks the control invalid and reads the error only while there is one", async () => {
    const container = render(<Validated />);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.getAttribute("aria-invalid")).toBeNull();
    input.focus();
    await userEvent.keyboard("{End}");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    await expect
      .element(page.getByRole("slider", { name: "Gain" }))
      .toHaveAccessibleDescription("Between −24 and 24 dB Above 6 dB, the export may clip");
    await userEvent.keyboard("{Home}");
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(container.querySelector(".hm-field-error")).toBeNull();
  });

  it("focuses the control when the label is clicked", async () => {
    render(<Field label="File name">{(control) => <input {...control} />}</Field>);
    await userEvent.click(page.getByText("File name"));
    expect(document.activeElement?.tagName).toBe("INPUT");
  });

  it("stacks its parts, and keeps the layout unstyled", () => {
    const container = render(
      <>
        <Field label="Styled" error="Wrong">
          <Slider />
        </Field>
        <Field label="Plain" error="Wrong" unstyled>
          <Slider />
        </Field>
      </>,
    );
    const [styled, plain] = [...container.querySelectorAll(".hm-field")];
    for (const field of [styled, plain]) {
      expect(getComputedStyle(field as Element).display).toBe("grid");
    }
    const error = (field: Element | undefined) =>
      getComputedStyle(field?.querySelector(".hm-field-error") as Element).color;
    expect(error(styled)).not.toBe(error(plain));
  });

  it("lets component tokens set on an ancestor restyle it", () => {
    const container = render(
      <div style={{ ["--hm-field-error-fg" as string]: "rgb(255, 0, 0)" }}>
        <Field label="Gain" error="Wrong">
          <Slider />
        </Field>
      </div>,
    );
    expect(getComputedStyle(container.querySelector(".hm-field-error") as Element).color).toBe(
      "rgb(255, 0, 0)",
    );
  });

  it("forwards its ref to the root", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Field ref={ref} label="Gain">
        <Slider />
      </Field>,
    );
    expect(ref.current?.classList.contains("hm-field")).toBe(true);
  });

  it("hydrates without errors or warnings, with the same ids", async () => {
    const app = <Validated />;
    const container = mount(renderToString(app));
    const serverId = container.querySelector("input")?.id;
    const consoleError = vi.spyOn(console, "error");
    const recoverable: unknown[] = [];
    act(() => {
      root = hydrateRoot(container, app, { onRecoverableError: (e) => recoverable.push(e) });
    });
    expect(recoverable).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    expect(container.querySelector("input")?.id).toBe(serverId);
    await expect.element(page.getByRole("slider", { name: "Gain" })).toBeInTheDocument();
  });
});
