import { createMessages, sdkCoreMessages } from "@hussmartinez/sdk-core";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { uiMessages } from "../../messages/en.js";
import { Field } from "../field/Field.js";
import { UiMessagesProvider } from "../messages/UiMessagesProvider.js";
import { NumberField } from "./NumberField.js";

afterEach(() => {
  vi.restoreAllMocks();
});

/** The value of an attribute on the first `<input>`, in any case. */
function attribute(html: string, name: string): string | undefined {
  const input = /<input\b[^>]*>/.exec(html)?.[0] ?? "";
  // HTML attribute names aren't case-sensitive; React writes some in camelCase.
  return new RegExp(`\\s${name}="([^"]*)"`, "i").exec(input)?.[1];
}

describe("NumberField on the server", () => {
  it("renders a named spin button with its value, range and text", () => {
    const html = renderToString(
      <NumberField label="Zoom" min={10} max={400} defaultValue={1250} />,
    );
    expect(attribute(html, "type")).toBe("text");
    expect(attribute(html, "role")).toBe("spinbutton");
    expect(attribute(html, "aria-label")).toBe("Zoom");
    expect(attribute(html, "class")).toBe("hm-number-field");
    // Kept within max, and formatted for English.
    expect(attribute(html, "value")).toBe("400");
    expect(attribute(html, "aria-valuenow")).toBe("400");
    expect(attribute(html, "aria-valuemin")).toBe("10");
    expect(attribute(html, "aria-valuemax")).toBe("400");
    expect(attribute(html, "aria-valuetext")).toBe("400");
    expect(attribute(html, "inputmode")).toBe("decimal");
    expect(attribute(html, "autocomplete")).toBe("off");
    expect(attribute(html, "spellcheck")).toBe("false");
  });

  it("starts at 0 within its range, never -0, and leaves out an open range", () => {
    expect(attribute(renderToString(<NumberField label="Gain" />), "value")).toBe("0");
    expect(attribute(renderToString(<NumberField label="Gain" min={5} />), "value")).toBe("5");
    expect(attribute(renderToString(<NumberField label="Gain" value={-0} />), "value")).toBe("0");
    const html = renderToString(<NumberField label="Gain" />);
    expect(attribute(html, "aria-valuemin")).toBeUndefined();
    expect(attribute(html, "aria-valuemax")).toBeUndefined();
  });

  it("asks for a keyboard with a minus sign when the value can be negative", () => {
    expect(attribute(renderToString(<NumberField label="Gain" min={-24} />), "inputmode")).toBe(
      "text",
    );
    expect(
      attribute(renderToString(<NumberField label="Gain" inputMode="numeric" />), "inputmode"),
    ).toBe("numeric");
  });

  it("formats for its locale, or the messages' locale", () => {
    expect(
      attribute(
        renderToString(<NumberField label="Size" locale="de" value={1234.5} step={0.1} />),
        "value",
      ),
    ).toBe("1.234,5");
    const messages = createMessages({ ...sdkCoreMessages, ...uiMessages }, { locale: "de" });
    const html = renderToString(
      <UiMessagesProvider messages={messages}>
        <NumberField label="Size" value={0.5} step={0.1} />
      </UiMessagesProvider>,
    );
    expect(attribute(html, "value")).toBe("0,5");
  });

  it("shows as many decimals as the value or the step has", () => {
    expect(attribute(renderToString(<NumberField label="Gain" value={1.25} />), "value")).toBe(
      "1.25",
    );
    expect(
      attribute(renderToString(<NumberField label="Gain" value={2} step={0.5} />), "value"),
    ).toBe("2");
  });

  it("uses a custom format for the text and aria-valuetext", () => {
    const html = renderToString(
      <NumberField
        label="Position"
        value={65}
        format={(s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`}
      />,
    );
    expect(attribute(html, "value")).toBe("1:05");
    expect(attribute(html, "aria-valuetext")).toBe("1:05");
    expect(attribute(html, "aria-valuenow")).toBe("65");
  });

  it("submits the number, not the formatted text, with a name", () => {
    const html = renderToString(
      <NumberField label="Size" name="size" locale="de" value={1234.5} />,
    );
    expect(attribute(html, "name")).toBeUndefined();
    expect(html).toContain('<input type="hidden" name="size" value="1234.5"/>');
  });

  it("connects to a Field", () => {
    const html = renderToString(
      <Field label="Zoom" error="Too far">
        <NumberField />
      </Field>,
    );
    expect(attribute(html, "id")).toBeTruthy();
    expect(attribute(html, "aria-invalid")).toBe("true");
    expect(attribute(html, "aria-describedby")).toBeTruthy();
    expect(attribute(html, "aria-label")).toBeUndefined();
  });

  it("adds className and classNames, and marks unstyled", () => {
    const html = renderToString(
      <NumberField label="Zoom" className="app" classNames={{ root: "root" }} unstyled />,
    );
    expect(attribute(html, "class")).toBe("hm-number-field root app");
    expect(attribute(html, "data-hm-unstyled")).toBe("");
  });

  it("warns in development without an accessible name, and with a name inside a Field", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderToString(<NumberField />);
    expect(warn).toHaveBeenLastCalledWith(
      expect.stringMatching(/NumberField needs an accessible name/),
    );
    renderToString(
      <Field label="Zoom">
        <NumberField label="Magnification" />
      </Field>,
    );
    expect(warn).toHaveBeenLastCalledWith(expect.stringMatching(/set Field's label instead/));
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
