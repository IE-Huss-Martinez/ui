/**
 * Writes src/icons/icons.generated.tsx from lucide-static's icon data and
 * src/icons/manifest.ts (docs/adr/0005). Vite's module runner loads the
 * TypeScript source, as for the tokens. A unit test fails when the committed
 * file is stale, and generation stops on any shape or attribute outside the
 * allowlist in src/icons/generate.ts.
 */
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";

const root = new URL("../", import.meta.url);
const require = createRequire(root);
const read = async (specifier: string): Promise<unknown> =>
  JSON.parse(await readFile(require.resolve(specifier), "utf8"));

const { module } = await runnerImport<typeof import("../src/icons/generate.js")>(
  fileURLToPath(new URL("src/icons/generate.ts", root)),
);
const { version } = (await read("lucide-static/package.json")) as { version: string };
const nodes = (await read("lucide-static/icon-nodes.json")) as Record<string, unknown>;
const path = "src/icons/icons.generated.tsx";
// Formatted as the repository formats it, so the committed file passes Biome
// and the staleness test can compare it exactly.
const formatted = execFileSync(
  require.resolve("@biomejs/biome/bin/biome"),
  ["format", `--stdin-file-path=${path}`],
  { input: module.generateIconsSource(nodes, version), encoding: "utf8" },
);
await writeFile(new URL(path, root), formatted);
process.stdout.write(`Wrote ${path} from lucide-static ${version}\n`);
