import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProgressBar } from "../progress-bar/ProgressBar.js";
import { Spinner } from "./Spinner.js";

describe("Spinner on the server", () => {
  it("is an indeterminate progress bar named Loading by default", () => {
    expect(renderToString(<Spinner />)).toBe(
      '<span role="progressbar" aria-label="Loading" class="hm-spinner"></span>',
    );
  });

  it("takes a label, classes and unstyled", () => {
    const html = renderToString(<Spinner label="Loading pages" className="x" unstyled />);
    expect(html).toContain('aria-label="Loading pages"');
    expect(html).toContain('class="hm-spinner x"');
    expect(html).toContain('data-hm-unstyled=""');
  });
});

describe("ProgressBar on the server", () => {
  it("is a native progress element with its value, maximum and name", () => {
    const html = renderToString(<ProgressBar value={30} max={120} valueText="Page 3 of 12" />);
    expect(html).toBe(
      '<progress value="30" max="120" aria-label="Progress" aria-valuetext="Page 3 of 12" class="hm-progress-bar"></progress>',
    );
  });

  it("clamps the value, and is indeterminate without one", () => {
    expect(renderToString(<ProgressBar value={150} />)).toContain('value="100"');
    expect(renderToString(<ProgressBar value={-5} />)).toContain('value="0"');
    expect(renderToString(<ProgressBar label="Exporting" />)).toBe(
      '<progress max="100" aria-label="Exporting" class="hm-progress-bar"></progress>',
    );
  });

  it("needs no inline style, so a strict Content Security Policy can't break it", () => {
    expect(renderToString(<ProgressBar value={50} />)).not.toContain("style=");
  });
});
