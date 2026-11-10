import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { tokens } from "../tokens/definitions.js";

const COMPONENTS = new URL("./", import.meta.url);

async function componentCss(): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  for (const entry of await readdir(COMPONENTS, { recursive: true })) {
    if (entry.endsWith(".css")) {
      files[entry] = await readFile(new URL(entry, COMPONENTS), "utf8");
    }
  }
  return files;
}

const componentTokens = tokens.filter((t) => t.level === "component");
const baseTokens = new Set(tokens.filter((t) => t.level === "base").map((t) => t.name));
const VAR = /var\(\s*--hm-([a-z0-9-]+)(?:\s*,\s*var\(--hm-([a-z0-9-]+)\))?/g;

describe("component CSS", () => {
  it("reads every component token with its declared fallback, and never declares one", async () => {
    const files = await componentCss();
    const used = new Set<string>();
    for (const [file, css] of Object.entries(files)) {
      for (const [, name, fallback] of css.matchAll(VAR)) {
        const definition = componentTokens.find((t) => t.name === name);
        if (definition) {
          used.add(definition.name);
          expect(fallback, `${file}: --hm-${name}`).toBe(definition.fallback);
        }
      }
      for (const definition of componentTokens) {
        expect(css, `${file} declares --hm-${definition.name}`).not.toMatch(
          new RegExp(`--hm-${definition.name}\\s*:`),
        );
      }
    }
    expect([...componentTokens.map((t) => t.name)].filter((n) => !used.has(n))).toEqual([]);
  });

  it("uses only tokens that exist", async () => {
    const known = new Set(tokens.map((t) => t.name));
    for (const [file, css] of Object.entries(await componentCss())) {
      for (const [, name, fallback] of css.matchAll(VAR)) {
        expect(known.has(name as string), `${file} uses unknown --hm-${name}`).toBe(true);
        if (fallback) {
          expect(known.has(fallback), `${file} uses unknown --hm-${fallback}`).toBe(true);
        }
      }
    }
  });

  it("uses only semantic and component tokens (ADR 0006)", async () => {
    for (const [file, css] of Object.entries(await componentCss())) {
      for (const [, name, fallback] of css.matchAll(VAR)) {
        expect(baseTokens.has(name as string), `${file} uses base token --hm-${name}`).toBe(false);
        if (fallback) {
          expect(baseTokens.has(fallback), `${file} falls back to --hm-${fallback}`).toBe(false);
        }
      }
    }
  });

  it("is imported by styles.css", async () => {
    const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");
    for (const file of Object.keys(await componentCss())) {
      expect(styles, file).toContain(`@import "./components/${file}";`);
    }
  });
});
