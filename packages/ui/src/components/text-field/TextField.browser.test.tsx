import { act, createRef, useState } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { cleanUp, loadStyles, mount } from "../../test/dom.js";
import { Field } from "../field/Field.js";
import { TextField } from "./TextField.js";

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

/** A controlled field with validation, as an export dialog would have. */
function FileName() {
  const [name, setName] = useState("");
  return (
    <Field
      label="File name"
      description="Without the extension"
      error={name.includes("/") ? "A name can't contain /" : undefined}
    >
      <TextField value={name} onValueChange={setName} />
    </Field>
  );
}

describe("TextField", () => {
  it("is a textbox named and described by its Field, and marked invalid with its error", async () => {
    const container = render(<FileName />);
    const box = page.getByRole("textbox", { name: "File name" });
    await expect.element(box).toHaveAccessibleDescription("Without the extension");
    await userEvent.type(container.querySelector("input") as HTMLInputElement, "a/b");
    await expect.element(box).toHaveAttribute("aria-invalid", "true");
    await expect
      .element(box)
      .toHaveAccessibleDescription("Without the extension A name can't contain /");
  });

  it("calls onChange and onValueChange as the text changes", async () => {
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    const container = render(
      <TextField label="Name" onChange={onChange} onValueChange={onValueChange} />,
    );
    await userEvent.type(container.querySelector("input") as HTMLInputElement, "ab");
    expect(onValueChange.mock.calls).toEqual([["a"], ["ab"]]);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("submits its text with a form", () => {
    const container = render(
      <form>
        <TextField label="Name" name="name" defaultValue="report" />
      </form>,
    );
    expect(new FormData(container.querySelector("form") as HTMLFormElement).get("name")).toBe(
      "report",
    );
  });

  it("forwards its ref to the input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextField label="Name" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("meets the target size, shows a focus ring, and keeps both unstyled", async () => {
    const container = render(
      <>
        <TextField label="Styled" />
        <TextField label="Plain" unstyled />
      </>,
    );
    const [styled, plain] = [...container.querySelectorAll("input")] as HTMLInputElement[];
    for (const input of [styled, plain]) {
      expect(input?.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    }
    expect(getComputedStyle(styled as Element).borderTopColor).not.toBe(
      getComputedStyle(plain as Element).borderTopColor,
    );
    styled?.focus();
    expect(getComputedStyle(styled as Element).outlineStyle).toBe("solid");
    plain?.focus();
    expect(getComputedStyle(plain as Element).outlineStyle).toBe("solid");
  });

  it("marks an invalid field with the invalid border token", () => {
    const container = render(
      <div style={{ ["--hm-text-field-invalid-border-color" as string]: "rgb(255, 0, 0)" }}>
        <TextField label="Name" aria-invalid />
      </div>,
    );
    expect(getComputedStyle(container.querySelector("input") as Element).borderTopColor).toBe(
      "rgb(255, 0, 0)",
    );
  });

  it("hydrates without errors or warnings", () => {
    const app = <FileName />;
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
