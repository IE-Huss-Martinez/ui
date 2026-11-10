import { checkContrast } from "@hussmartinez/ui";
import { describe, expect, it } from "vitest";
import { poster } from "./poster.js";

describe("the Poster demo theme", () => {
  it.each(["light", "dark"] as const)(
    "%s meets WCAG 2.2 AA for every colour pair, all of them checkable",
    (variant) => {
      const report = checkContrast(poster[variant]);
      expect(report.unchecked).toEqual([]);
      expect(report.failures).toEqual([]);
    },
  );

  it("really is unusual: square, monospace and with hard shadows", () => {
    expect(poster.light.tokens["radius-control"]).toBe("0");
    expect(poster.light.tokens["font-family"]).toBe("var(--hm-font-mono)");
    expect(poster.dark.tokens["shadow-raised"]).toBe("4px 4px 0 #fff8e7");
  });
});
