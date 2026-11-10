import { createTheme, themeToCss } from "@hussmartinez/ui";
import { renderToString } from "react-dom/server";
import { App } from "./App.js";

const brand = createTheme({ extends: "light", tokens: { "color-accent": "#5b21b6" } });

/** The page's HTML and theme CSS, rendered in Node at build time. */
export function render(): { html: string; css: string } {
  return { html: renderToString(<App />), css: themeToCss(brand, ".brand") };
}
