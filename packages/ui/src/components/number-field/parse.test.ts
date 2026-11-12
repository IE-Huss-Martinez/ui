import { describe, expect, it } from "vitest";
import { notationOf, parseIn } from "./NumberField.js";

const LOCALES = ["en", "de", "fr", "de-CH", "es", "pt-BR", "ar-EG", "fa", "hi-IN", "en-IN", "ja"];
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

  it("accepts group separators only between whole groups, so a typo never multiplies the value", () => {
    const de = notationOf("de");
    expect(parseIn(de, "1.500")).toBe(1500);
    expect(parseIn(de, "1.234.567,8")).toBe(1234567.8);
    // The English habit in German: a decimal point where the group goes.
    for (const text of ["2.5", "2.50", "0.75", "1.5", "1.5.5", "1.2345", ".500", "1.500,5,5"]) {
      expect(parseIn(de, text), `de ${text}`).toBeUndefined();
    }
    const en = notationOf("en");
    expect(parseIn(en, "1,234,567.5")).toBe(1234567.5);
    for (const text of ["1,5", "1,50", "12,3456", "1,234,56", ",500"]) {
      expect(parseIn(en, text), `en ${text}`).toBeUndefined();
    }
    // Indian grouping: groups of 2, then a last group of 3.
    expect(parseIn(notationOf("en-IN"), "12,34,567")).toBe(1234567);
    expect(parseIn(notationOf("en-IN"), "12,34,56")).toBeUndefined();
    // Space-like groups follow the same rule.
    const fr = notationOf("fr");
    expect(parseIn(fr, "1 234 567,5")).toBe(1234567.5);
    expect(parseIn(fr, "1 23")).toBeUndefined();
    expect(parseIn(fr, "12 3456")).toBeUndefined();
    // Groups belong in the integer part only.
    expect(parseIn(en, "1.234,5")).toBeUndefined();
    expect(parseIn(de, "1,234.5")).toBeUndefined();
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
