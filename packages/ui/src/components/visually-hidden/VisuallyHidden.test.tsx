import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VisuallyHidden } from "./VisuallyHidden.js";

describe("VisuallyHidden on the server", () => {
  it("renders a span with its class, or a div", () => {
    expect(renderToString(<VisuallyHidden className="x">Hi</VisuallyHidden>)).toBe(
      '<span class="hm-visually-hidden x">Hi</span>',
    );
    expect(renderToString(<VisuallyHidden as="div">Hi</VisuallyHidden>)).toBe(
      '<div class="hm-visually-hidden">Hi</div>',
    );
  });
});
