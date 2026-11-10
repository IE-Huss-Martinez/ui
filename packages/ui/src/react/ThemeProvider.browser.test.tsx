import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
import { cleanUp, loadStyles, mount, token } from "../test/dom.js";
import { createTheme } from "../theme/create-theme.js";
import { ThemeProvider } from "./ThemeProvider.js";

const brandLight = createTheme({ extends: "light", tokens: { "color-accent": "#5b21b6" } });
const brandDark = createTheme({ extends: "dark", tokens: { "color-accent": "#c4b5fd" } });
const brand = { light: brandLight, dark: brandDark };

function App() {
  return (
    <ThemeProvider theme={brand} mode="system" density="compact">
      <p id="content">Hello</p>
    </ThemeProvider>
  );
}

let root: Root | undefined;

beforeEach(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  await commands.setColorScheme("light");
  await loadStyles();
});
afterEach(async () => {
  act(() => root?.unmount());
  root = undefined;
  cleanUp();
  vi.restoreAllMocks();
  await commands.setColorScheme("light");
});

describe("ThemeProvider", () => {
  it("applies its theme from the server HTML, before hydration, so nothing flashes", async () => {
    const container = mount(renderToString(<App />));
    const content = container.querySelector("#content");
    expect(token(content, "color-accent")).toBe("#5b21b6");
    expect(token(content, "control-height")).toBe("1.75rem");
    await commands.setColorScheme("dark");
    expect(token(content, "color-accent")).toBe("#c4b5fd");
  });

  it("hydrates without errors or warnings", () => {
    const container = mount(renderToString(<App />));
    const consoleError = vi.spyOn(console, "error");
    const consoleWarn = vi.spyOn(console, "warn");
    const recoverable: unknown[] = [];
    act(() => {
      root = hydrateRoot(container, <App />, {
        onRecoverableError: (error) => recoverable.push(error),
      });
    });
    expect(recoverable).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
    expect(token(container.querySelector("#content"), "color-accent")).toBe("#5b21b6");
  });
});
