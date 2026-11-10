/**
 * Writes the files generated from the token source: src/tokens/tokens.css and
 * docs/tokens.md. Vite's module runner loads the TypeScript source, so no
 * extra tool is needed. A unit test fails when the committed files are stale.
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";

const root = new URL("../", import.meta.url);
const { module } = await runnerImport<typeof import("../src/tokens/generate.js")>(
  fileURLToPath(new URL("src/tokens/generate.ts", root)),
);
for (const [path, content] of Object.entries(module.generateTokenFiles())) {
  await writeFile(new URL(path, root), content);
  process.stdout.write(`Wrote ${path}\n`);
}
