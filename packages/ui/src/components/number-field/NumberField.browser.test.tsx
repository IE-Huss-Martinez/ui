import { act, createRef, useState } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { cleanUp, loadStyles, mount } from "../../test/dom.js";
import { IconButton } from "../button/IconButton.js";
import { Field } from "../field/Field.js";
import { Toolbar } from "../toolbar/Toolbar.js";
import { NumberField, type NumberFieldProps } from "./NumberField.js";

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

/** Renders a field and an element to blur to, and focuses the field. */
function renderField(props: NumberFieldProps = {}): HTMLInputElement {
  const container = render(
    <>
      <NumberField label="Zoom" {...props} />
      <button type="button">Elsewhere</button>
    </>,
  );
  const input = container.querySelector("input") as HTMLInputElement;
  input.focus();
  return input;
}

/** Replaces the field's text, as a person would. */
async function retype(input: HTMLInputElement, text: string): Promise<void> {
  await userEvent.clear(input);
  if (text !== "") {
    await userEvent.type(input, text);
  }
}

/** Seconds as m:ss, and back. */
const timecode = {
  format: (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`,
  parse: (text: string) => {
    const match = /^(\d+):([0-5]\d)$/.exec(text.trim());
    return match ? Number(match[1]) * 60 + Number(match[2]) : undefined;
  },
};

function Controlled({ onValueChange }: { onValueChange: (value: number) => void }) {
  const [value, setValue] = useState(100);
  return (
    <>
      <NumberField
        label="Zoom"
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onValueChange(next);
        }}
      />
      <button type="button" onClick={() => setValue(50)}>
        Reset
      </button>
    </>
  );
}

describe("NumberField", () => {
  it("is a spin button named by its label", async () => {
    renderField({ defaultValue: 100, min: 10, max: 400 });
    const field = page.getByRole("spinbutton", { name: "Zoom" });
    await expect.element(field).toHaveAttribute("aria-valuenow", "100");
  });

  it("doesn't change the value while typing, and commits on blur", async () => {
    const onValueChange = vi.fn();
    const input = renderField({ defaultValue: 100, onValueChange });
    await retype(input, "150");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input.getAttribute("aria-valuenow")).toBe("100");
    expect(input.value).toBe("150");
    await userEvent.tab();
    expect(onValueChange).toHaveBeenCalledWith(150);
    expect(input.getAttribute("aria-valuenow")).toBe("150");
  });

  it("commits on Enter, and formats the committed text", async () => {
    const onValueChange = vi.fn();
    const input = renderField({ defaultValue: 0, onValueChange });
    await retype(input, "1234.50");
    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith(1234.5);
    expect(input.value).toBe("1,234.5");
    expect(document.activeElement).toBe(input);
  });

  it("keeps committed values within min and max", async () => {
    const onValueChange = vi.fn();
    const input = renderField({ defaultValue: 100, min: 10, max: 400, onValueChange });
    await retype(input, "900");
    await userEvent.keyboard("{Enter}");
    expect(input.value).toBe("400");
    await retype(input, "-5");
    await userEvent.keyboard("{Enter}");
    expect(input.value).toBe("10");
    expect(onValueChange.mock.calls).toEqual([[400], [10]]);
  });

  it("goes back to the value for text that isn't a number, or no text, never NaN", async () => {
    const onValueChange = vi.fn();
    const input = renderField({ defaultValue: 100, onValueChange });
    for (const text of ["abc", "", "1e3", "-"]) {
      await retype(input, text);
      await userEvent.keyboard("{Enter}");
      expect(input.value, text).toBe("100");
    }
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("throws the typing away with Escape, and leaves Escape alone otherwise", async () => {
    const onValueChange = vi.fn();
    const outer = vi.fn((event: KeyboardEvent) => event.defaultPrevented);
    document.addEventListener("keydown", outer);
    try {
      const input = renderField({ defaultValue: 100, onValueChange });
      await retype(input, "250");
      await userEvent.keyboard("{Escape}");
      expect(input.value).toBe("100");
      expect(outer.mock.results.at(-1)?.value).toBe(true);
      await userEvent.keyboard("{Escape}");
      expect(outer.mock.results.at(-1)?.value).toBe(false);
      await userEvent.tab();
      expect(onValueChange).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener("keydown", outer);
    }
  });

  it("steps with the arrow and Page keys, within the range", async () => {
    const input = renderField({ defaultValue: 100, min: 10, max: 400, step: 10 });
    const values: string[] = [];
    for (const key of [
      "{ArrowUp}",
      "{ArrowDown}",
      "{ArrowDown}",
      "{PageUp}",
      "{PageUp}",
      "{PageUp}",
      "{PageUp}",
    ]) {
      await userEvent.keyboard(key);
      values.push(input.value);
    }
    expect(values).toEqual(["110", "100", "90", "190", "290", "390", "400"]);
  });

  it("steps from what's typed, and by decimals without drifting", async () => {
    const input = renderField({ defaultValue: 0, step: 0.1 });
    await retype(input, "2");
    await userEvent.keyboard("{ArrowUp}");
    expect(input.value).toBe("2.1");
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    expect(input.value).toBe("2.3");
    act(() => root?.unmount());
    const zero = renderField({ defaultValue: 0, step: 0.1 });
    await userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}");
    expect(zero.value).toBe("0.3");
  });

  it("doesn't step when read-only", async () => {
    const onValueChange = vi.fn();
    const input = renderField({ defaultValue: 5, readOnly: true, onValueChange });
    await userEvent.keyboard("{ArrowUp}{PageUp}");
    expect(input.value).toBe("5");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("never fights typing: a new value from outside waits until the commit", async () => {
    const onValueChange = vi.fn();
    const container = render(<Controlled onValueChange={onValueChange} />);
    const input = container.querySelector("input") as HTMLInputElement;
    input.focus();
    await retype(input, "12");
    // The host changes the value while the person types.
    act(() => (container.querySelector("button") as HTMLButtonElement).click());
    expect(input.value).toBe("12");
    expect(input.getAttribute("aria-valuenow")).toBe("50");
    input.focus();
    await userEvent.keyboard("{Escape}");
    expect(input.value).toBe("50");
  });

  it("only asks to change when controlled", async () => {
    const onValueChange = vi.fn();
    const input = renderField({ value: 100, onValueChange });
    await userEvent.keyboard("{ArrowUp}");
    expect(onValueChange).toHaveBeenCalledWith(101);
    expect(input.value).toBe("100");
  });

  it("reads and writes numbers for its locale", async () => {
    const onValueChange = vi.fn();
    const input = renderField({ locale: "de", defaultValue: 0, step: 0.5, onValueChange });
    await retype(input, "1.234,5");
    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith(1234.5);
    expect(input.value).toBe("1.234,5");
  });

  it("reads the locale's own digits", async () => {
    const onValueChange = vi.fn();
    const input = renderField({ locale: "ar-EG", defaultValue: 0, onValueChange });
    await retype(input, "٤٢");
    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith(42);
    expect(input.value).toBe("٤٢");
  });

  it("is a timecode field with a custom parse and format", async () => {
    const onValueChange = vi.fn();
    const input = renderField({
      ...timecode,
      label: "Position",
      defaultValue: 65,
      min: 0,
      onValueChange,
    });
    expect(input.value).toBe("1:05");
    await retype(input, "2:30");
    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith(150);
    await userEvent.keyboard("{ArrowUp}");
    expect(input.value).toBe("2:31");
    expect(input.getAttribute("aria-valuetext")).toBe("2:31");
    await retype(input, "2:75");
    await userEvent.keyboard("{Enter}");
    expect(input.value).toBe("2:31");
  });

  it("submits the committed number when Enter submits the form", async () => {
    const submitted = vi.fn();
    const container = render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted(new FormData(event.currentTarget).get("size"));
        }}
      >
        <NumberField label="Size" name="size" locale="de" defaultValue={10} />
        <button type="submit">Save</button>
      </form>,
    );
    const input = container.querySelector('input[role="spinbutton"]') as HTMLInputElement;
    input.focus();
    await retype(input, "1.234,5");
    await userEvent.keyboard("{Enter}");
    expect(submitted).toHaveBeenCalledWith("1234.5");
  });

  it("ignores Enter while an input method is composing", () => {
    const onValueChange = vi.fn();
    const input = renderField({ defaultValue: 1, onValueChange });
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, "7");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true }),
      );
    });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input.value).toBe("7");
  });

  it("is named and described by a Field", async () => {
    render(
      <Field label="Zoom" description="Percent of the page width" error="Too far">
        <NumberField defaultValue={100} />
      </Field>,
    );
    const field = page.getByRole("spinbutton", { name: "Zoom" });
    await expect.element(field).toHaveAccessibleDescription("Percent of the page width Too far");
    await expect.element(field).toHaveAttribute("aria-invalid", "true");
  });

  it("keeps the caret keys inside a toolbar, and steps with Up and Down", async () => {
    const container = render(
      <Toolbar label="View">
        <IconButton label="Fit" icon={<svg />} />
        <NumberField label="Zoom" defaultValue={100} />
      </Toolbar>,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(input);
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}{Home}{End}");
    expect(document.activeElement).toBe(input);
    await userEvent.keyboard("{ArrowUp}");
    expect(input.value).toBe("101");
  });

  it("forwards its ref to the visible input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<NumberField label="Zoom" name="zoom" ref={ref} />);
    expect(ref.current?.getAttribute("role")).toBe("spinbutton");
  });

  it("meets the target size, shows a focus ring, and keeps both unstyled", async () => {
    const container = render(
      <>
        <NumberField label="Styled" />
        <NumberField label="Plain" unstyled />
      </>,
    );
    const [styled, plain] = [...container.querySelectorAll("input")] as HTMLInputElement[];
    for (const input of [styled, plain]) {
      expect(input?.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    }
    expect(getComputedStyle(styled as Element).borderTopColor).not.toBe(
      getComputedStyle(plain as Element).borderTopColor,
    );
    await userEvent.tab();
    expect(getComputedStyle(styled as Element).outlineStyle).toBe("solid");
    await userEvent.tab();
    expect(getComputedStyle(plain as Element).outlineStyle).toBe("solid");
  });

  it("marks an invalid field with the invalid border token", () => {
    const container = render(
      <div style={{ ["--hm-number-field-invalid-border-color" as string]: "rgb(255, 0, 0)" }}>
        <NumberField label="Zoom" aria-invalid />
      </div>,
    );
    expect(getComputedStyle(container.querySelector("input") as Element).borderTopColor).toBe(
      "rgb(255, 0, 0)",
    );
  });

  it("hydrates without errors or warnings", async () => {
    const app = (
      <Field label="Size">
        <NumberField locale="de" name="size" defaultValue={1234.5} step={0.5} />
      </Field>
    );
    const container = mount(renderToString(app));
    const consoleError = vi.spyOn(console, "error");
    const recoverable: unknown[] = [];
    act(() => {
      root = hydrateRoot(container, app, { onRecoverableError: (e) => recoverable.push(e) });
    });
    expect(recoverable).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    const input = container.querySelector('input[role="spinbutton"]') as HTMLInputElement;
    input.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(input.value).toBe("1.235");
  });
});
