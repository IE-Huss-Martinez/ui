import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "../react/ThemeProvider.js";
import { addStyle, cleanUp, loadStyles, mount } from "../test/dom.js";

beforeEach(async () => {
  await loadStyles();
});
afterEach(cleanUp);

/** What var(--hm-color-text) resolves to inside an element, as a computed colour. */
function themeText(element: Element): string {
  const probe = document.createElement("span");
  probe.style.color = "var(--hm-color-text)";
  element.append(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
}

function colour(element: Element | null): string {
  if (!element) {
    throw new Error("missing element");
  }
  return getComputedStyle(element).color;
}

// A host page that sets its text colour from the tokens once, at the top, as
// hosts commonly do. Without the base rule, everything below inherits this
// computed light-theme colour, whatever theme a subtree uses.
const PAGE = '<div data-hm-theme="light" id="page" style="color: var(--hm-color-text)">';

describe("text in themed subtrees", () => {
  it("takes the subtree's text colour inside data-hm-theme", () => {
    const root = mount(`${PAGE}<section data-hm-theme="dark"><p id="text">Hi</p></section></div>`);
    const page = root.querySelector("#page") as Element;
    const dark = root.querySelector("section") as Element;
    expect(themeText(dark)).not.toBe(themeText(page));
    expect(colour(root.querySelector("#text"))).toBe(themeText(dark));
  });

  it("takes the subtree's text colour inside ThemeProvider, through its display: contents wrapper", () => {
    const root = mount(
      `${PAGE}${renderToString(
        <ThemeProvider mode="dark">
          <p id="text">Hi</p>
        </ThemeProvider>,
      )}</div>`,
    );
    const scope = root.querySelector("[data-hm-theme-scope]") as Element;
    expect(getComputedStyle(scope).display).toBe("contents");
    expect(themeText(scope)).not.toBe(themeText(root.querySelector("#page") as Element));
    expect(colour(root.querySelector("#text"))).toBe(themeText(scope));
  });

  it("lets unlayered host CSS still set the colour of a themed subtree", () => {
    addStyle(".host-text { color: rgb(1, 2, 3); }");
    const root = mount(
      `${PAGE}<section data-hm-theme="dark" class="host-text"><p id="text">Hi</p></section></div>`,
    );
    expect(colour(root.querySelector("section"))).toBe("rgb(1, 2, 3)");
    expect(colour(root.querySelector("#text"))).toBe("rgb(1, 2, 3)");
  });
});
