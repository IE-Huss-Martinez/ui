import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Field } from "../field/Field.js";
import { TextField } from "./TextField.js";

afterEach(() => {
  vi.restoreAllMocks();
});

/** The value of an attribute on the first `<input>`, in any case. */
const attribute = (html: string, name: string) =>
  new RegExp(`<input\\b[^>]*\\s${name}="([^"]*)"`, "i").exec(html)?.[1];

describe("TextField on the server", () => {
  it("renders a named text input with the hm class", () => {
    const html = renderToString(<TextField label="File name" defaultValue="report" />);
    expect(attribute(html, "type")).toBe("text");
    expect(attribute(html, "aria-label")).toBe("File name");
    expect(attribute(html, "class")).toBe("hm-text-field");
    expect(attribute(html, "value")).toBe("report");
  });

  it("takes other single-line types and passes native attributes through", () => {
    const html = renderToString(
      <TextField
        label="Search"
        type="search"
        placeholder="Pages"
        maxLength={40}
        autoComplete="off"
      />,
    );
    expect(attribute(html, "type")).toBe("search");
    expect(attribute(html, "placeholder")).toBe("Pages");
    expect(attribute(html, "maxLength")).toBe("40");
    expect(attribute(html, "autoComplete")).toBe("off");
  });

  it("connects to a Field", () => {
    const html = renderToString(
      <Field label="File name" error="Enter a name">
        <TextField />
      </Field>,
    );
    expect(attribute(html, "id")).toBeTruthy();
    expect(attribute(html, "aria-invalid")).toBe("true");
    expect(attribute(html, "aria-describedby")).toBeTruthy();
    expect(attribute(html, "aria-label")).toBeUndefined();
  });

  it("adds className and classNames, and marks unstyled", () => {
    const html = renderToString(
      <TextField label="Name" className="app" classNames={{ root: "root" }} unstyled />,
    );
    expect(attribute(html, "class")).toBe("hm-text-field root app");
    expect(attribute(html, "data-hm-unstyled")).toBe("");
  });

  it("warns in development without an accessible name, and with a name inside a Field", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderToString(<TextField />);
    expect(warn).toHaveBeenLastCalledWith(
      expect.stringMatching(/TextField needs an accessible name/),
    );
    renderToString(
      <Field label="File name">
        <TextField label="Name" />
      </Field>,
    );
    expect(warn).toHaveBeenLastCalledWith(expect.stringMatching(/set Field's label instead/));
  });
});
