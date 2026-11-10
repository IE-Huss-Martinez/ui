import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createTheme, darkTheme, lightTheme } from "../theme/create-theme.js";
import { ThemeProvider } from "./ThemeProvider.js";

describe("ThemeProvider on the server", () => {
  it("renders the built-in themes as attributes only, with no inline style", () => {
    const html = renderToString(
      <ThemeProvider mode="dark" density="compact">
        <p>Hello</p>
      </ThemeProvider>,
    );
    expect(html).toMatch(
      /^<div data-hm-theme-scope="hm[\w-]+" data-hm-theme="dark" data-hm-density="compact"><p>Hello<\/p><\/div>$/,
    );
  });

  it("defaults to system mode", () => {
    expect(renderToString(<ThemeProvider />)).toContain('data-hm-theme="system"');
  });

  it("renders a custom pair as a style element scoped to its own wrapper", () => {
    const html = renderToString(
      <ThemeProvider theme={{ light: lightTheme, dark: darkTheme }} nonce="abc123">
        <p>Hello</p>
      </ThemeProvider>,
    );
    const scope = /data-hm-theme-scope="([^"]+)"/.exec(html)?.[1];
    expect(scope).toBeDefined();
    expect(html).toContain('<style nonce="abc123">@layer hm.tokens, hm.base,');
    expect(html).toContain("@layer hm.tokens.theme {");
    expect(html).toContain(`@scope ([data-hm-theme-scope="${scope}"])`);
    expect(html).toContain("@media (prefers-color-scheme: dark)");
  });

  it("writes CSS combinators unescaped inside the style element", () => {
    const html = renderToString(<ThemeProvider theme={lightTheme} />);
    expect(html).not.toContain("&gt;");
    expect(html).not.toContain("&quot;");
  });

  it("renders a single theme without a mode attribute", () => {
    const theme = createTheme({ extends: "dark" });
    const html = renderToString(<ThemeProvider theme={theme} />);
    expect(html).not.toContain("data-hm-theme=");
    expect(html).toContain("--hm-color-scheme: dark;");
  });

  it("gives sibling providers different scopes", () => {
    const html = renderToString(
      <>
        <ThemeProvider theme={lightTheme} />
        <ThemeProvider theme={darkTheme} />
      </>,
    );
    const scopes = [...html.matchAll(/data-hm-theme-scope="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(scopes).size).toBe(2);
  });
});
