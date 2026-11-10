import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "./Button.js";
import { IconButton } from "./IconButton.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Button on the server", () => {
  it("renders a secondary, medium button of type button by default", () => {
    expect(renderToString(<Button>Save</Button>)).toBe(
      '<button type="button" class="hm-button hm-button--secondary"><span class="hm-button-label">Save</span></button>',
    );
  });

  it("renders variants, sizes, toggles and icons with hm classes and ARIA state", () => {
    const html = renderToString(
      <Button variant="primary" size="small" pressed startIcon={<svg />} endIcon={<svg />}>
        Bold
      </Button>,
    );
    expect(html).toContain('class="hm-button hm-button--primary hm-button--small"');
    expect(html).toContain('aria-pressed="true"');
    expect(html.match(/<span class="hm-button-icon" aria-hidden="true">/g)).toHaveLength(2);
  });

  it("adds className and classNames per part, and marks unstyled", () => {
    const html = renderToString(
      <Button
        className="app"
        classNames={{ root: "root", icon: "icon", label: "label" }}
        startIcon={<svg />}
        unstyled
      >
        Go
      </Button>,
    );
    expect(html).toContain('class="hm-button hm-button--secondary root app"');
    expect(html).toContain('data-hm-unstyled=""');
    expect(html).toContain('class="hm-button-icon icon"');
    expect(html).toContain('class="hm-button-label label"');
  });

  it("keeps a submit type when asked", () => {
    expect(renderToString(<Button type="submit">Send</Button>)).toContain('type="submit"');
  });

  it("uses aria-disabled instead of disabled when it must stay focusable", () => {
    const html = renderToString(
      <Button disabled focusableWhenDisabled>
        Undo
      </Button>,
    );
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toMatch(/\sdisabled=""/);
  });
});

describe("IconButton on the server", () => {
  it("is a button named by its label, with the icon hidden from assistive technology", () => {
    const html = renderToString(<IconButton label="Rotate" icon={<svg />} />);
    expect(html).toContain('aria-label="Rotate"');
    expect(html).toContain('class="hm-button hm-button--secondary hm-icon-button"');
    expect(html).toContain('<span class="hm-button-icon" aria-hidden="true"><svg></svg></span>');
    expect(html).not.toContain("hm-button-label");
  });

  it("warns in development when its label is empty", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderToString(<IconButton label=" " icon={<svg />} />);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/IconButton needs a label/));
  });
});
