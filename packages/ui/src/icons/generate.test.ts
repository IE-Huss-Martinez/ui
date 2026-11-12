import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { componentName, generateIconsSource, validateIconNode } from "./generate.js";
import { iconManifest } from "./manifest.js";

const root = new URL("../../", import.meta.url);
const require = createRequire(root);
const lucide = {
  version: (require("lucide-static/package.json") as { version: string }).version,
  nodes: require("lucide-static/icon-nodes.json") as Record<string, unknown>,
  licence: () => readFile(require.resolve("lucide-static/LICENSE"), "utf8"),
};

/** The generated source, formatted as scripts/generate-icons.ts formats it. */
function formatted(source: string): string {
  return execFileSync(
    require.resolve("@biomejs/biome/bin/biome"),
    ["format", "--stdin-file-path=src/icons/icons.generated.tsx"],
    { input: source, encoding: "utf8", cwd: new URL("../../", root) },
  );
}

describe("the generated icons", () => {
  it("match the manifest and the pinned lucide-static: run `pnpm icons` after changing either", async () => {
    const committed = await readFile(new URL("src/icons/icons.generated.tsx", root), "utf8");
    expect(committed).toBe(formatted(generateIconsSource(lucide.nodes, lucide.version)));
  });

  it("ship Lucide's licence, verbatim, for the pinned version", async () => {
    const notices = await readFile(new URL("THIRD_PARTY_NOTICES.md", root), "utf8");
    expect(notices).toContain(`\`lucide-static\` ${lucide.version}`);
    expect(notices).toContain((await lucide.licence()).trim());
  });

  it("name every icon in kebab-case, each with a component of its own", () => {
    const names = Object.keys(iconManifest);
    expect(names.every((name) => /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name))).toBe(true);
    expect(new Set(names.map(componentName)).size).toBe(names.length);
    expect(componentName("rotate-left")).toBe("RotateLeftIcon");
    expect(componentName("page-grid")).toBe("PageGridIcon");
  });

  it("fail generation for a glyph lucide-static doesn't have", () => {
    expect(() => generateIconsSource({}, "0.0.0", { gone: { lucide: "no-such-glyph" } })).toThrow(
      /no glyph no-such-glyph/,
    );
  });
});

describe("the allowlist", () => {
  it("accepts every glyph in the pinned lucide-static, so adding an icon needs no code change", () => {
    for (const [name, data] of Object.entries(lucide.nodes)) {
      expect(() => validateIconNode(name, data), name).not.toThrow();
    }
  });

  it.each([
    ["a script element", [["script", { src: "x.js" }]]],
    ["a foreignObject", [["foreignObject", {}]]],
    ["a use element", [["use", { href: "#x" }]]],
    ["an inherited element name", [["constructor", {}]]],
    ["an event handler", [["path", { d: "M0 0", onload: "alert(1)" }]]],
    ["a style", [["path", { d: "M0 0", style: "fill:red" }]]],
    ["a link", [["path", { d: "M0 0", href: "https://example.com" }]]],
    ["an inherited attribute name", [["path", { constructor: "M0 0" }]]],
    ["script in path data", [["path", { d: "javascript:alert(1)" }]]],
    ["a url in path data", [["path", { d: "M0 0 url(#x)" }]]],
    ["markup in a number", [["circle", { cx: '1"/><script>', cy: "1", r: "1" }]]],
    [
      "a fill other than currentColor or none",
      [["circle", { cx: "1", cy: "1", r: "1", fill: "red" }]],
    ],
    ["a number that isn't a string", [["circle", { cx: 1, cy: "1", r: "1" }]]],
    ["no shapes", []],
    ["not a list", { path: "M0 0" }],
  ])("refuses %s", (_, data) => {
    expect(() => validateIconNode("hostile", data)).toThrow(/Icon hostile/);
  });
});
