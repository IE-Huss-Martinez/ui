import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToggleButton } from "./ToggleButton.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ToggleButton on the server", () => {
  it("renders an off button with aria-pressed and the hm classes", () => {
    expect(renderToString(<ToggleButton>Loop</ToggleButton>)).toBe(
      '<button type="button" class="hm-button hm-button--secondary hm-toggle-button" aria-pressed="false"><span class="hm-button-label">Loop</span></button>',
    );
  });

  it("starts on from defaultPressed, and follows pressed when controlled", () => {
    expect(renderToString(<ToggleButton defaultPressed>Loop</ToggleButton>)).toContain(
      'aria-pressed="true"',
    );
    expect(
      renderToString(
        <ToggleButton pressed={false} defaultPressed>
          Loop
        </ToggleButton>,
      ),
    ).toContain('aria-pressed="false"');
  });

  it("is a square icon button named by its label, with the icon hidden", () => {
    const html = renderToString(
      <ToggleButton variant="quiet" label="Loop" icon={<svg />} defaultPressed />,
    );
    expect(html).toContain('class="hm-button hm-button--quiet hm-toggle-button hm-icon-button"');
    expect(html).toContain('aria-label="Loop"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('<span class="hm-button-icon" aria-hidden="true"><svg></svg></span>');
    expect(html).not.toContain("hm-button-label");
  });

  it("adds className and classNames per part, and marks unstyled", () => {
    const html = renderToString(
      <ToggleButton
        className="app"
        classNames={{ root: "root", icon: "icon", label: "label" }}
        startIcon={<svg />}
        unstyled
      >
        Loop
      </ToggleButton>,
    );
    expect(html).toContain('class="hm-button hm-button--secondary root hm-toggle-button app"');
    expect(html).toContain('data-hm-unstyled=""');
    expect(html).toContain('class="hm-button-icon icon"');
    expect(html).toContain('class="hm-button-label label"');
  });

  it("warns in development when an icon-only toggle has an empty label", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderToString(<ToggleButton label=" " icon={<svg />} />);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/ToggleButton needs a label/));
  });
});

describe("ToggleButton's props", () => {
  it("reject what a toggle can't be, at compile time", () => {
    const rejected = [
      // @ts-expect-error A solid fill would make an off toggle look on.
      <ToggleButton key="primary" variant="primary">
        Loop
      </ToggleButton>,
      // @ts-expect-error An icon-only toggle needs its label.
      <ToggleButton key="unlabelled" icon={<svg />} />,
      // @ts-expect-error A label is for icon-only toggles; text toggles use children.
      <ToggleButton key="both" label="Loop" icon={<svg />}>
        Loop
      </ToggleButton>,
    ];
    expect(rejected).toHaveLength(3);
  });
});
