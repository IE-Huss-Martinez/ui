/**
 * Renders the page in Node with the server build, and writes the HTML into
 * the client build's index.html, so the browser hydrates server-rendered
 * markup, as in any server-rendered Vite application.
 */
import { readFile, writeFile } from "node:fs/promises";

const page = new URL("dist/index.html", import.meta.url);
const { render } = await import(new URL("dist-server/entry-server.js", import.meta.url).href);
const { html, css } = render();
const template = await readFile(page, "utf8");
await writeFile(
  page,
  template.replace("<!--app-->", html).replace("<!--theme-->", `<style>${css}</style>`),
);
process.stdout.write("Rendered dist/index.html on the server.\n");
