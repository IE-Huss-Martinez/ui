import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build, type Rolldown } from "vite";
import { afterAll, describe, expect, it } from "vitest";
import { externalPackages } from "./vite.config.js";

/**
 * Builds the package in memory with its real Vite config, so these checks see
 * exactly what dist/ would contain without writing to it.
 */
async function buildInMemory(): Promise<Array<Rolldown.OutputChunk | Rolldown.OutputAsset>> {
  const result = await build({
    configFile: new URL("vite.config.ts", import.meta.url).pathname,
    logLevel: "silent",
    build: { write: false },
  });
  const outputs = Array.isArray(result) ? result : [result];
  return outputs.flatMap((output) => ("output" in output ? output.output : []));
}

const files = await buildInMemory();

function chunk(fileName: string): Rolldown.OutputChunk {
  const found = files.find((file) => file.fileName === fileName);
  if (found?.type !== "chunk") {
    throw new Error(`${fileName} wasn't built as a JavaScript chunk`);
  }
  return found;
}

describe("the built package", () => {
  it('starts the React entry with "use client" (ADR 0007)', () => {
    expect(chunk("react.js").code).toMatch(/^"use client";\n/);
  });

  it('keeps "use client" out of the server-safe entry (ADR 0004)', () => {
    expect(chunk("index.js").code).not.toContain("use client");
  });

  it("emits the stylesheet as its own file", () => {
    const styles = files.find((file) => file.fileName === "styles.css");
    expect(styles?.type).toBe("asset");
  });

  it("imports dependencies and peer dependencies instead of bundling them", () => {
    const javascript = files.filter((file) => file.type === "chunk");
    const code = javascript.map((file) => file.code).join("\n");
    expect(code).toContain('from "@hussmartinez/sdk-core"');
    expect(code).toContain('from "react/jsx-runtime"');
    expect(code).toContain('from "react"');
    expect(externalPackages).toEqual(
      expect.arrayContaining(["@hussmartinez/sdk-core", "react", "react-dom"]),
    );
    for (const file of javascript) {
      // Bundled React or sdk-core would bring their own copies of these.
      expect(file.code, file.fileName).not.toContain("react.transitional.element");
      expect(file.code, file.fileName).not.toContain("class SdkError");
    }
  });

  it("uses the production JSX runtime and leaks no local paths", () => {
    const code = files.flatMap((file) => (file.type === "chunk" ? [file.code] : [])).join("\n");
    expect(code).not.toContain("jsx-dev-runtime");
    expect(code).not.toContain(process.cwd());
  });

  it("never imports CSS from JavaScript (ADR 0004)", () => {
    const javascript = files.filter((file) => file.type === "chunk");
    expect(javascript.length).toBeGreaterThan(0);
    for (const file of javascript) {
      expect(file.imports.filter((name) => name.endsWith(".css"))).toEqual([]);
      expect(file.code).not.toMatch(/import\s*["'][^"']+\.css["']/);
    }
  });
});

/**
 * Bundles an application's import from the built package, minified, the way a
 * host's bundler would. The temporary directory has no package.json, so the
 * `sideEffects` field doesn't help: only side-effect-free modules are dropped.
 */
async function bundleImport(source: string): Promise<string> {
  const directory = await temporaryBuild;
  const entry = join(directory, `app-${Math.random().toString(36).slice(2)}.js`);
  await writeFile(entry, source);
  const result = await build({
    configFile: false,
    logLevel: "silent",
    build: {
      write: false,
      minify: true,
      lib: { entry, formats: ["es"], fileName: "app" },
      rolldownOptions: {
        external: (id) => /^(react|react-dom|@hussmartinez\/sdk-core)(\/|$)/.test(id),
      },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  return outputs
    .flatMap((output) => ("output" in output ? output.output : []))
    .flatMap((file) => (file.type === "chunk" ? [file.code] : []))
    .join("\n");
}

const temporaryBuild = (async () => {
  const directory = await mkdtemp(join(tmpdir(), "hm-ui-build-"));
  await build({
    configFile: new URL("vite.config.ts", import.meta.url).pathname,
    logLevel: "silent",
    build: { outDir: directory, emptyOutDir: true },
  });
  return directory;
})();

afterAll(async () => {
  await rm(await temporaryBuild, { recursive: true, force: true });
});

// Strings that only appear in the validator, the colour maths and the token data.
const VALIDATOR = "isn't allowed";
const COLOUR_MATHS = "3963377774";
const TOKEN_DATA = "color-on-accent";

describe("what applications ship", () => {
  it("drops the validator, colour maths and token data with ThemeProvider and built-in themes", async () => {
    const code = await bundleImport(
      'import { ThemeProvider } from "./react.js"; export const app = ThemeProvider;',
    );
    expect(code).toContain("data-hm-theme-scope");
    expect(code).not.toContain(VALIDATOR);
    expect(code).not.toContain(COLOUR_MATHS);
    expect(code).not.toContain(TOKEN_DATA);
  });

  it("drops everything from the root entry that isn't imported", async () => {
    const code = await bundleImport(
      'import { uiMessages } from "./index.js"; export const m = uiMessages;',
    );
    expect(code).toContain("INVALID_THEME_TOKEN");
    expect(code).not.toContain(VALIDATOR);
    expect(code).not.toContain(COLOUR_MATHS);
    expect(code).not.toContain(TOKEN_DATA);
  });
});
