// The visual tests' container (scripts/test-visual.mjs) runs as root with the
// checkout mounted. Every workspace package needs its own node_modules volume,
// or the container's install writes root-owned files into the host's
// checkout, which later breaks `pnpm install` with EACCES.
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { workspacePackageDirs } from "../scripts/workspace-packages.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
let scratch = "";

afterEach(async () => {
  if (scratch) {
    await rm(scratch, { recursive: true, force: true });
    scratch = "";
  }
});

describe("the workspace's packages", () => {
  it("are every folder pnpm-workspace.yaml covers", () => {
    expect(workspacePackageDirs(root)).toEqual([
      "apps/catalogue",
      "e2e",
      "examples/next",
      "examples/vite",
      "packages/ui",
    ]);
  });

  it("expand folder/* globs, skip folders without a package.json, and ignore comments", async () => {
    scratch = await mkdtemp(join(tmpdir(), "hm-workspace-"));
    await writeFile(
      join(scratch, "pnpm-workspace.yaml"),
      'packages:\n  - packages/*\n  # a comment\n  - "tools"\n\ncatalog:\n  x: ^1\n',
    );
    for (const dir of ["packages/a", "packages/b", "packages/empty", "tools"]) {
      await mkdir(join(scratch, dir), { recursive: true });
      if (!dir.endsWith("empty")) {
        await writeFile(join(scratch, dir, "package.json"), "{}");
      }
    }
    expect(workspacePackageDirs(scratch)).toEqual(["packages/a", "packages/b", "tools"]);
  });
});

describe("the visual tests' container", () => {
  it("mounts a node_modules volume for every workspace package", async () => {
    const script = await readFile(new URL("../scripts/test-visual.mjs", import.meta.url), "utf8");
    expect(script).toContain("workspacePackageDirs(root).flatMap(");
    expect(script).toMatch(/`\$\{dir\}\/node_modules`/);
  });

  it("hands every root-owned file in the checkout back, without failing the run", async () => {
    const script = await readFile(new URL("../scripts/test-visual.mjs", import.meta.url), "utf8");
    expect(script).toMatch(/find \/work -xdev -user 0 -exec chown \$\{owner\} \{\} \+/);
    expect(script).toContain("|| true; }");
  });
});
