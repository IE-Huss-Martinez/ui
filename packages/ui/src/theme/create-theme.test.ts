import { isSdkError } from "@hussmartinez/sdk-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UiError } from "../errors/ui-error.js";
import { lightValues } from "../tokens/themes.js";
import { checkContrast } from "./contrast-check.js";
import { createTheme, darkTheme, lightTheme, toTheme } from "./create-theme.js";
import type { CompleteThemeTokens } from "./types.js";

afterEach(() => {
  vi.restoreAllMocks();
});

function catchError(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  throw new Error("expected an error");
}

describe("createTheme", () => {
  it("extends a built-in theme by name, changing only what it sets", () => {
    const theme = createTheme({ extends: "light", tokens: { "color-accent": "#6d28d9" } });
    expect(theme.tokens["color-accent"]).toBe("#6d28d9");
    expect(theme.tokens["color-text"]).toBe(lightTheme.tokens["color-text"]);
    expect(theme.colorScheme).toBe("light");
    expect(theme.tokens["color-scheme"]).toBe("light");
  });

  it("extends another custom theme, and can change its colour scheme", () => {
    const base = createTheme({ extends: "dark", tokens: { "radius-control": "0" } });
    const theme = createTheme({ extends: base, colorScheme: "light" });
    expect(theme.tokens["radius-control"]).toBe("0");
    expect(theme.tokens["color-scheme"]).toBe("light");
  });

  it("writes values back normalised, from the parsed value", () => {
    const theme = createTheme({ extends: "light", tokens: { "color-accent": "  RGB(0,0,0)  " } });
    expect(theme.tokens["color-accent"]).toBe("rgb(0, 0, 0)");
  });

  it("accepts a complete theme without extends", () => {
    const { "color-scheme": _scheme, ...semantic } = lightValues;
    const theme = createTheme({
      tokens: {
        ...semantic,
        "control-height": "2rem",
        "control-height-small": "1.5rem",
        "control-padding-x": "0.75rem",
        "control-gap": "0.5rem",
        "icon-size": "1.25rem",
        "target-size": "1.5rem",
        "gap-tight": "0.25rem",
        "gap-normal": "0.5rem",
        "gap-loose": "1rem",
        "inset-tight": "0.5rem",
        "inset-normal": "0.75rem",
        "inset-loose": "1.25rem",
      } satisfies CompleteThemeTokens,
    });
    expect(theme.tokens["color-bg"]).toBe("var(--hm-white)");
    expect(theme.coarsePointer["target-size"]).toBe("2.75rem");
  });

  it("requires every semantic token without extends", () => {
    const error = catchError(() => createTheme({ tokens: { "color-bg": "#fff" } as never }));
    expect(isSdkError(error, "INVALID_THEME_TOKEN")).toBe(true);
    expect((error as UiError).details?.["reason"]).toMatch(/missing/);
  });

  it("freezes themes", () => {
    const theme = createTheme({ extends: "light" });
    expect(Object.isFrozen(theme)).toBe(true);
    expect(Object.isFrozen(theme.tokens)).toBe(true);
    expect(Object.isFrozen(lightTheme.compact)).toBe(true);
  });

  it("takes compact and coarse-pointer density values", () => {
    const theme = createTheme({
      extends: "light",
      density: { compact: { "control-height": "1.5rem" } },
      coarsePointer: { "target-size": "3rem" },
    });
    expect(theme.compact["control-height"]).toBe("1.5rem");
    expect(theme.coarsePointer["target-size"]).toBe("3rem");
    expect(theme.coarsePointer["control-height"]).toBe("2.75rem");
  });

  it("accepts well-formed component tokens, which SDKs define", () => {
    const theme = createTheme({
      extends: "light",
      tokens: { "pdf-thumb-radius": "0" } as never,
    });
    expect(theme.tokens["pdf-thumb-radius"]).toBe("0");
  });

  it.each([
    ["an injected value", { "color-accent": "red; } body { display: none" }],
    ["a value of the wrong type", { "color-accent": "16px" }],
    ["a name that isn't a token", { "Color Accent": "#fff" }],
    ["a name with markup", { "</style>": "#fff" }],
    ["a value that isn't a string", { "color-accent": 3 }],
    ["the colour scheme as a token", { "color-scheme": "dark" }],
  ])("rejects %s with INVALID_THEME_TOKEN", (_name, tokens) => {
    const error = catchError(() => createTheme({ extends: "light", tokens: tokens as never }));
    expect(error).toBeInstanceOf(UiError);
    expect(isSdkError(error, "INVALID_THEME_TOKEN")).toBe(true);
    expect((error as UiError).details).toHaveProperty("token");
    expect((error as UiError).details).toHaveProperty("reason");
  });

  it("rejects non-density tokens in density values", () => {
    const error = catchError(() =>
      createTheme({ extends: "light", density: { compact: { "color-bg": "#000" } as never } }),
    );
    expect(isSdkError(error, "INVALID_THEME_TOKEN")).toBe(true);
  });

  it("rejects input that isn't an options object", () => {
    expect(() => createTheme(null as never)).toThrow(UiError);
    expect(() => createTheme({ extends: "sepia" } as never)).toThrow(UiError);
  });

  it("warns in development when contrast is below WCAG AA", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    createTheme({ extends: "light", tokens: { "color-text": "#ccc" } });
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/color-text on color-bg: \d/));
  });

  it("lists colour pairs it can't check", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    createTheme({
      extends: "light",
      tokens: { "color-text": "color-mix(in oklch, #000 90%, #fff)" },
    });
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/couldn't be checked.*color-text/));
  });

  it("stays quiet for a theme that meets contrast", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    createTheme({ extends: "dark", tokens: { "radius-control": "0" } });
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("checkContrast", () => {
  it("reports the failing pair with its ratio", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const theme = createTheme({ extends: "light", tokens: { "color-on-accent": "#3b6cf0" } });
    const failure = checkContrast(theme).failures.find(
      (f) => f.foreground === "color-on-accent" && f.background === "color-accent",
    );
    expect(failure?.minimum).toBe(4.5);
    expect(failure?.ratio).toBeLessThan(4.5);
  });
});

describe("toTheme", () => {
  it("returns themes from createTheme as they are", () => {
    expect(toTheme(darkTheme)).toBe(darkTheme);
  });

  it("validates a theme that came from JSON", () => {
    const copy = JSON.parse(JSON.stringify(lightTheme)) as unknown;
    expect(toTheme(copy).tokens["color-text"]).toBe("var(--hm-gray-900)");
  });

  it("rejects a forged theme with an injected value", () => {
    const forged = JSON.parse(JSON.stringify(lightTheme)) as { tokens: Record<string, string> };
    forged.tokens["color-bg"] = "red}</style><script>alert(1)</script>";
    expect(() => toTheme(forged)).toThrow(UiError);
  });
});
