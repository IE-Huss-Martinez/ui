import { mkdir, rm } from "node:fs/promises";
import { type ComponentType, createElement } from "react";
import { renderToString } from "react-dom/server";
import { build } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Server safety of the built package (ADR 0007): importing either entry, and
 * rendering every component on the server, must not touch the browser. The
 * browser's globals are replaced by getters that throw, so any access fails
 * the test, rather than quietly reading undefined.
 */
const BROWSER_GLOBALS = [
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "HTMLElement",
  "customElements",
  "matchMedia",
  "requestAnimationFrame",
  "getComputedStyle",
  "ResizeObserver",
  "MutationObserver",
  "CSS",
] as const;

// Inside the package, so the built files resolve react from its dependencies.
const directory = new URL("temp/server-check/", import.meta.url);
const touched: string[] = [];
const saved = new Map<string, PropertyDescriptor | undefined>();

function trapBrowserGlobals(): void {
  for (const name of BROWSER_GLOBALS) {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, {
      configurable: true,
      get() {
        touched.push(name);
        throw new Error(`${name} was read on the server`);
      },
    });
  }
}

function restoreBrowserGlobals(): void {
  for (const [name, descriptor] of saved) {
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor);
    } else {
      delete (globalThis as Record<string, unknown>)[name];
    }
  }
}

let ui: Record<string, unknown>;
let react: Record<string, unknown>;

beforeAll(async () => {
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  await build({
    configFile: new URL("vite.config.ts", import.meta.url).pathname,
    logLevel: "silent",
    build: { outDir: directory.pathname, emptyOutDir: true },
  });
  trapBrowserGlobals();
  ui = await import(new URL("index.js", directory).href);
  react = await import(new URL("react.js", directory).href);
});

afterAll(async () => {
  restoreBrowserGlobals();
  await rm(directory, { recursive: true, force: true });
});

const noop = (): void => undefined;
const icon = createElement("svg");

describe("the built package on a server", () => {
  it("imports both entries without touching the browser", () => {
    expect(Object.keys(ui)).toContain("createTheme");
    expect(Object.keys(react)).toContain("ThemeProvider");
    expect(touched).toEqual([]);
  });

  it("creates and writes themes without touching the browser", () => {
    const createTheme = ui["createTheme"] as (input: unknown) => unknown;
    const themeToCss = ui["themeToCss"] as (theme: unknown, selector?: string) => string;
    const theme = createTheme({ extends: "dark", tokens: { "color-accent": "#5b21b6" } });
    expect(themeToCss(theme, ".brand")).toContain("--hm-color-accent: #5b21b6;");
    expect(touched).toEqual([]);
  });

  it("renders every component without touching the browser", () => {
    const component = (name: string) => react[name] as ComponentType<Record<string, unknown>>;
    const rendered: Record<string, Record<string, unknown>> = {
      ThemeProvider: { mode: "dark", density: "compact" },
      UiMessagesProvider: {
        messages: { locale: "en", t: () => "", error: () => "" },
        children: createElement("p", null, "Text"),
      },
      AnnouncerProvider: {},
      Button: { children: "Save", startIcon: icon },
      IconButton: { label: "Rotate", icon },
      ToggleButton: { label: "Loop", icon, defaultPressed: true },
      VisuallyHidden: { children: "Hidden" },
      Toolbar: { label: "Tools", children: createElement(component("ToolbarSeparator")) },
      ToolbarGroup: { label: "Group" },
      ToolbarSeparator: {},
      SegmentedControl: {
        label: "View",
        value: "a",
        onValueChange: noop,
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ],
      },
      Dialog: { open: true, onOpenChange: noop, title: "Title", children: "Body" },
      Spinner: {},
      ProgressBar: { value: 40 },
    };
    const exportedComponents = Object.keys(react).filter((name) => /^[A-Z]/.test(name));
    expect(exportedComponents.sort()).toEqual(Object.keys(rendered).sort());
    for (const [name, props] of Object.entries(rendered)) {
      expect(renderToString(createElement(component(name), props)), name).not.toBe("");
    }
    expect(touched).toEqual([]);
  });
});
