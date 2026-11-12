import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Slider } from "./Slider.js";

afterEach(() => {
  vi.restoreAllMocks();
});

const renderedValue = (html: string): string | undefined => /\svalue="([^"]*)"/.exec(html)?.[1];

describe("Slider on the server", () => {
  it("renders a named native range with the hm class, starting at min", () => {
    const html = renderToString(<Slider label="Volume" min={-60} max={0} />);
    expect(html).toMatch(/^<input [^>]*\/>$/);
    expect(html).toContain('type="range"');
    expect(html).toContain('min="-60"');
    expect(html).toContain('max="0"');
    expect(html).toContain('step="1"');
    expect(html).toContain('aria-label="Volume"');
    expect(html).toContain('class="hm-slider"');
    expect(renderedValue(html)).toBe("-60");
    expect(html).not.toContain("aria-valuetext");
    expect(html).not.toContain("style=");
  });

  it("gives screen readers formatValue's text", () => {
    const html = renderToString(
      <Slider label="Volume" min={-60} max={0} defaultValue={-6} formatValue={(v) => `${v} dB`} />,
    );
    expect(html).toContain('aria-valuetext="-6 dB"');
  });

  it("keeps the value in range and on a step", () => {
    expect(renderedValue(renderToString(<Slider label="Zoom" value={130} />))).toBe("100");
    expect(renderedValue(renderToString(<Slider label="Zoom" value={-5} />))).toBe("0");
    expect(renderedValue(renderToString(<Slider label="Zoom" step={5} value={12.6} />))).toBe("15");
    expect(
      renderedValue(renderToString(<Slider label="Gain" max={1} step={0.1} value={0.1 + 0.2} />)),
    ).toBe("0.3");
    // A step that doesn't divide the range stops at the last whole step.
    expect(renderedValue(renderToString(<Slider label="Zoom" step={30} value={100} />))).toBe("90");
  });

  it("follows value over defaultValue when controlled", () => {
    expect(
      renderedValue(renderToString(<Slider label="Zoom" value={20} defaultValue={80} />)),
    ).toBe("20");
  });

  it("adds className and classNames, and marks unstyled", () => {
    const html = renderToString(
      <Slider label="Zoom" className="app" classNames={{ root: "root" }} unstyled />,
    );
    expect(html).toContain('class="hm-slider root app"');
    expect(html).toContain('data-hm-unstyled=""');
  });

  it("warns in development without an accessible name, but not with a label's target", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderToString(<Slider id="volume" />);
    renderToString(<Slider aria-labelledby="heading" />);
    expect(warn).not.toHaveBeenCalled();
    renderToString(<Slider />);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/Slider needs an accessible name/));
  });
});
