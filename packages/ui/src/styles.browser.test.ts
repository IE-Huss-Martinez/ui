import { afterEach, describe, expect, it } from "vitest";
import { addStyle, cleanUp, loadStyles, mount, track } from "./test/dom.js";

afterEach(cleanUp);

describe("styles.css", () => {
  it("declares the cascade layers first, in the order of ADR 0005", async () => {
    const sheet = await loadStyles();
    const [first, second] = [...sheet.cssRules];
    expect(first).toBeInstanceOf(CSSLayerStatementRule);
    expect([...(first as CSSLayerStatementRule).nameList]).toEqual([
      "hm.tokens",
      "hm.base",
      "hm.components",
      "hm.sdk",
    ]);
    expect([...(second as CSSLayerStatementRule).nameList]).toEqual([
      "hm.tokens.default",
      "hm.tokens.theme",
    ]);
  });

  it("makes later layers win, whatever order their rules load in", async () => {
    await loadStyles();
    // Each rule is in an earlier layer than the one before it, so without the
    // declared order the last rule in the source would win.
    addStyle(`
      @layer hm.sdk { .hm-layer-probe { order: 4; } }
      @layer hm.components { .hm-layer-probe { order: 3; } }
      @layer hm.base { .hm-layer-probe { order: 2; } }
      @layer hm.tokens { .hm-layer-probe { order: 1; } }
    `);
    const probe = track(document.createElement("div"));
    probe.className = "hm-layer-probe";
    document.body.append(probe);
    expect(getComputedStyle(probe).order).toBe("4");

    // A host's unlayered CSS beats every hm layer, without !important.
    addStyle(".hm-layer-probe { order: 5; }");
    expect(getComputedStyle(probe).order).toBe("5");
  });

  it("makes ThemeProvider's wrapper take no box, and themed roots set color-scheme", async () => {
    await loadStyles();
    const root = mount('<div data-hm-theme="dark"><div data-hm-theme-scope="x"></div></div>');
    const themed = root.querySelector("[data-hm-theme]") as Element;
    expect(getComputedStyle(themed).colorScheme).toBe("dark");
    expect(getComputedStyle(root.querySelector("[data-hm-theme-scope]") as Element).display).toBe(
      "contents",
    );
  });
});
