import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build as esbuild } from "esbuild";
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

const EXTERNAL = /^(react|react-dom|@hussmartinez\/sdk-core)(\/|$)/;

/**
 * Bundles an application's import from the built package, minified, the way a
 * host's bundler would: with Rolldown (Vite) and with esbuild, whose
 * tree-shaking is more conservative. The temporary directory has no
 * package.json, so the `sideEffects` field doesn't help: only side-effect-free
 * modules are dropped.
 */
async function bundleImport(source: string): Promise<{ bundler: string; code: string }[]> {
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
      rolldownOptions: { external: (id) => EXTERNAL.test(id) },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  const rolldown = outputs
    .flatMap((output) => ("output" in output ? output.output : []))
    .flatMap((file) => (file.type === "chunk" ? [file.code] : []))
    .join("\n");
  const esbuilt = await esbuild({
    entryPoints: [entry],
    bundle: true,
    minify: true,
    format: "esm",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "external",
        setup(pluginBuild) {
          pluginBuild.onResolve({ filter: EXTERNAL }, (args) => ({
            path: args.path,
            external: true,
          }));
        },
      },
    ],
  });
  return [
    { bundler: "rolldown", code: rolldown },
    { bundler: "esbuild", code: esbuilt.outputFiles.map((file) => file.text).join("\n") },
  ];
}

/** Checks what every bundler shipped. */
async function expectShipped(
  source: string,
  check: { includes: string[]; excludes: string[] },
): Promise<void> {
  for (const { bundler, code } of await bundleImport(source)) {
    for (const text of check.includes) {
      expect(code, `${bundler} should keep "${text}"`).toContain(text);
    }
    for (const text of check.excludes) {
      expect(code, `${bundler} should drop "${text}"`).not.toContain(text);
    }
  }
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

// Strings that only appear in the toolbar's roving focus.
const ROVING_FOCUS = "textarea:not(:disabled)";

describe("what applications ship", () => {
  it("drops the validator, colour maths and token data with ThemeProvider and built-in themes", async () => {
    await expectShipped(
      'import { ThemeProvider } from "./react.js"; export const app = ThemeProvider;',
      {
        includes: ["data-hm-theme-scope"],
        // sdk-core is external here, so its import line stays as written; a
        // host's bundler drops what's unused, as sdk-core has no side effects.
        excludes: [VALIDATOR, COLOUR_MATHS, TOKEN_DATA, "hm-button", ROVING_FOCUS],
      },
    );
  });

  it("drops the components an application doesn't import", async () => {
    await expectShipped('import { Button } from "./react.js"; export const app = Button;', {
      includes: ["hm-button"],
      excludes: [
        "data-hm-theme-scope",
        "hm-visually-hidden",
        "hm-toolbar",
        "hm-toggle-button",
        "hm-slider",
        "hm-field",
        "hm-number-field",
        ROVING_FOCUS,
      ],
    });
    await expectShipped(
      'import { ToggleButton } from "./react.js"; export const app = ToggleButton;',
      { includes: ["hm-toggle-button", "hm-button"], excludes: ["hm-toolbar", ROVING_FOCUS] },
    );
    await expectShipped('import { Slider } from "./react.js"; export const app = Slider;', {
      includes: ["hm-slider"],
      excludes: ["hm-button", "hm-toolbar", "hm-field", ROVING_FOCUS],
    });
    await expectShipped('import { Field } from "./react.js"; export const app = Field;', {
      includes: ["hm-field"],
      excludes: ["hm-slider", "hm-number-field", "hm-button", ROVING_FOCUS],
    });
    // The number field reads only the messages' locale, so it doesn't ship
    // ui's English text.
    await expectShipped(
      'import { NumberField } from "./react.js"; export const app = NumberField;',
      {
        includes: ["hm-number-field", "spinbutton"],
        excludes: ["hm-slider", "hm-button", ROVING_FOCUS, "INVALID_THEME_TOKEN", "dialog.close"],
      },
    );
    await expectShipped(
      'import { SegmentedControl } from "./react.js"; export const app = SegmentedControl;',
      { includes: ["hm-segmented-control"], excludes: ["hm-button", ROVING_FOCUS] },
    );
  });

  it("drops everything from the root entry that isn't imported", async () => {
    await expectShipped('import { uiMessages } from "./index.js"; export const m = uiMessages;', {
      includes: ["INVALID_THEME_TOKEN"],
      excludes: [VALIDATOR, COLOUR_MATHS, TOKEN_DATA],
    });
  });
});
