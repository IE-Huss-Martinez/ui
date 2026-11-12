import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Slider } from "../slider/Slider.js";
import { Field } from "./Field.js";

afterEach(() => {
  vi.restoreAllMocks();
});

/** The value of an attribute on the first element with the given tag. */
function attribute(html: string, tag: string, name: string): string | undefined {
  const element = new RegExp(`<${tag}\\b[^>]*>`).exec(html)?.[0] ?? "";
  return new RegExp(`\\s${name}="([^"]*)"`).exec(element)?.[1];
}

describe("Field on the server", () => {
  it("points the label at the control, and describes it with the description and error", () => {
    const html = renderToString(
      <Field label="Gain" description="Between −24 and 24 dB" error="Too loud">
        <Slider />
      </Field>,
    );
    const id = attribute(html, "input", "id");
    expect(id).toBeTruthy();
    expect(attribute(html, "label", "for")).toBe(id);
    const describedBy = attribute(html, "input", "aria-describedby")?.split(" ") ?? [];
    expect(describedBy).toHaveLength(2);
    expect(html).toContain(
      `<div id="${describedBy[0]}" class="hm-field-description">Between −24 and 24 dB</div>`,
    );
    expect(html).toContain(`<div id="${describedBy[1]}" class="hm-field-error">Too loud</div>`);
    expect(attribute(html, "input", "aria-invalid")).toBe("true");
    expect(html.indexOf("hm-field-description")).toBeLessThan(html.indexOf("<input"));
    expect(html.indexOf("<input")).toBeLessThan(html.indexOf("hm-field-error"));
  });

  it("adds nothing for a missing description or error", () => {
    const html = renderToString(
      <Field label="Gain" description={null} error={false}>
        <Slider />
      </Field>,
    );
    expect(attribute(html, "input", "aria-describedby")).toBeUndefined();
    expect(attribute(html, "input", "aria-invalid")).toBeUndefined();
    expect(html).not.toContain("hm-field-description");
    expect(html).not.toContain("hm-field-error");
  });

  it("gives any other control its props through a function", () => {
    const html = renderToString(
      <Field label="Name" description="As it appears on the cover" controlId="name">
        {(control) => <input {...control} />}
      </Field>,
    );
    expect(attribute(html, "label", "for")).toBe("name");
    expect(attribute(html, "input", "id")).toBe("name");
    const descriptionId = /id="([^"]+)" class="hm-field-description"/.exec(html)?.[1];
    expect(descriptionId).toBeTruthy();
    expect(attribute(html, "input", "aria-describedby")).toBe(descriptionId);
  });

  it("keeps a control's own descriptions and invalid state", () => {
    const html = renderToString(
      <Field label="Gain" error="Too loud">
        <Slider aria-describedby="hint" aria-invalid={false} />
      </Field>,
    );
    const describedBy = attribute(html, "input", "aria-describedby")?.split(" ");
    expect(describedBy).toHaveLength(2);
    expect(describedBy?.[1]).toBe("hint");
    expect(attribute(html, "input", "aria-invalid")).toBe("false");
  });

  it("doesn't warn that a slider in a field has no name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderToString(
      <Field label="Gain">
        <Slider />
      </Field>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns in development when the control's own id breaks the label", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderToString(
      <Field label="Gain">
        <Slider id="gain" />
      </Field>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/Pass the id to Field's controlId/));
  });

  it("adds className and classNames per part, and marks unstyled", () => {
    const html = renderToString(
      <Field
        label="Gain"
        description="Help"
        error="Wrong"
        className="app"
        classNames={{ root: "root", label: "label", description: "description", error: "error" }}
        unstyled
      >
        <Slider />
      </Field>,
    );
    expect(html).toContain('class="hm-field root app"');
    expect(html).toContain('data-hm-unstyled=""');
    expect(html).toContain('class="hm-field-label label"');
    expect(html).toContain('class="hm-field-description description"');
    expect(html).toContain('class="hm-field-error error"');
  });
});
