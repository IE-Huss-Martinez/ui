import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

  it("writes ui's version into the React entry, for the second-copy warning (ADR 0036)", async () => {
    const { version } = JSON.parse(
      await readFile(new URL("package.json", import.meta.url), "utf8"),
    );
    const code = files.flatMap((file) => (file.type === "chunk" ? [file.code] : [])).join("\n");
    expect(code).not.toContain("__HM_UI_VERSION__");
    expect(chunk("react.js").code).toContain(JSON.stringify(version));
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
async function bundleImport(
  source: string,
  environment?: "production" | "development",
): Promise<{ bundler: string; code: string }[]> {
  // As an application's bundler defines it; left alone when not given.
  const define =
    environment === undefined ? {} : { "process.env.NODE_ENV": JSON.stringify(environment) };
  const directory = await temporaryBuild;
  const entry = join(directory, `app-${Math.random().toString(36).slice(2)}.js`);
  await writeFile(entry, source);
  const result = await build({
    configFile: false,
    logLevel: "silent",
    define,
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
    define,
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
  environment?: "production" | "development",
): Promise<void> {
  for (const { bundler, code } of await bundleImport(source, environment)) {
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
        "hm-file-drop-zone",
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
    await expectShipped(
      'import { FileDropZone } from "./react.js"; export const app = FileDropZone;',
      {
        includes: ["hm-file-drop-zone", "hm-button"],
        excludes: ["hm-slider", "hm-number-field", "hm-field-", ROVING_FOCUS],
      },
    );
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

// Texts that only appear in development warnings.
const WARNINGS = [
  "IconButton needs a label",
  "below WCAG 2.2 AA contrast",
  "copies of @hussmartinez/ui",
  "[@hussmartinez/ui]",
];

describe("development warnings", () => {
  const app =
    'import { IconButton, ThemeProvider } from "./react.js"; import { createTheme } from "./index.js"; export const app = [IconButton, ThemeProvider, createTheme];';

  it("stay in development bundles", async () => {
    await expectShipped(app, { includes: WARNINGS, excludes: [] }, "development");
  });

  it("are dropped from production bundles, text and all", async () => {
    await expectShipped(app, { includes: ["hm-icon-button"], excludes: WARNINGS }, "production");
  });

  it("take createTheme's contrast check, and its colour maths, with them in production", async () => {
    const theme = 'import { createTheme } from "./index.js"; export const app = createTheme;';
    await expectShipped(theme, { includes: [COLOUR_MATHS], excludes: [] }, "development");
    await expectShipped(theme, { includes: [VALIDATOR], excludes: [COLOUR_MATHS] }, "production");
  });
});

// Path data only one icon has: undo's arrow, and play's triangle.
const UNDO_PATH = "M9 14 4 9l5-5";
const PLAY_PATH = "M5 5a2 2 0 0 1 3.008-1.728";

describe("icons", () => {
  it("ship one at a time: an application keeps only the icons it imports", async () => {
    await expectShipped('import { UndoIcon } from "./react.js"; export const app = UndoIcon;', {
      includes: [UNDO_PATH, "hm-icon"],
      excludes: [PLAY_PATH, "hm-button", ROVING_FOCUS],
    });
  });

  it("keep Lucide's licence notice in the built React entry", () => {
    expect(chunk("react.js").code).toContain("Icons from Lucide (https://lucide.dev), ISC licence");
  });
});
