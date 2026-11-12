import { describe, expect, it } from "vitest";
import { notationOf, parseIn } from "./NumberField.js";

const LOCALES = ["en", "de", "fr", "de-CH", "es", "pt-BR", "ar-EG", "fa", "hi-IN", "ja"];
const VALUES = [0, 7, -6, 0.5, -0.25, 1234.5, -12345.678, 1000000];

describe("the default parse", () => {
  it.each(LOCALES)("reads back every number the %s format writes", (locale) => {
    const notation = notationOf(locale);
    const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
    for (const value of VALUES) {
      expect(parseIn(notation, format.format(value)), `${locale}: ${format.format(value)}`).toBe(
        value,
      );
    }
  });

  it("reads what people type: plain digits, without groups, with a hyphen or a real minus", () => {
    const en = notationOf("en");
    expect(parseIn(en, "1234.5")).toBe(1234.5);
    expect(parseIn(en, " -6 ")).toBe(-6);
    expect(parseIn(en, "−6")).toBe(-6);
    expect(parseIn(en, "+3")).toBe(3);
    expect(parseIn(en, ".5")).toBe(0.5);
    expect(parseIn(en, "5.")).toBe(5);
  });

  it("follows the locale's separators", () => {
    expect(parseIn(notationOf("de"), "1.234,5")).toBe(1234.5);
    expect(parseIn(notationOf("de"), "0,25")).toBe(0.25);
    // A space group separator: people type a plain space.
    expect(parseIn(notationOf("fr"), "1 234,5")).toBe(1234.5);
    // Swiss German, with either apostrophe.
    expect(parseIn(notationOf("de-CH"), "1'234.5")).toBe(1234.5);
    expect(parseIn(notationOf("de-CH"), "1’234.5")).toBe(1234.5);
  });

  it("reads the locale's own digits", () => {
    expect(parseIn(notationOf("ar-EG"), "١٢٫٥")).toBe(12.5);
    expect(parseIn(notationOf("fa"), "۴۲")).toBe(42);
  });

  it("refuses anything that isn't a number, so the value is never NaN", () => {
    const en = notationOf("en");
    for (const text of [
      "",
      " ",
      "-",
      ".",
      "abc",
      "1e3",
      "1.2.3",
      "12a",
      "--1",
      "Infinity",
      "NaN",
      "0x10",
      "1,2,3.4.5",
    ]) {
      expect(parseIn(en, text), JSON.stringify(text)).toBeUndefined();
    }
  });
});
