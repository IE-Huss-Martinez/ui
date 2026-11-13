/**
 * The workspace's packages, from the `packages:` globs in pnpm-workspace.yaml:
 * a plain path, or a folder followed by `/*` for each of its subfolders. Only
 * folders with a package.json count. Used by test-visual.mjs, so the container
 * gives every package its own node_modules volume.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * @param {string} root The workspace root.
 * @returns {string[]} Package folders, relative to `root`, sorted.
 */
export function workspacePackageDirs(root) {
  const workspace = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
  const block = /^packages:\n((?:[ \t]+.*\n|[ \t]*#.*\n|\n)*)/m.exec(workspace)?.[1] ?? "";
  const globs = [...block.matchAll(/^[ \t]+-[ \t]+["']?([^"'\s#]+)["']?/gm)].map(
    ([, glob]) => glob,
  );
  if (globs.length === 0) {
    throw new Error("pnpm-workspace.yaml lists no packages.");
  }
  const dirs = globs.flatMap((glob) => {
    if (glob.endsWith("/*")) {
      const parent = glob.slice(0, -2);
      return readdirSync(join(root, parent), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => `${parent}/${entry.name}`);
    }
    if (/[*?[{]/.test(glob)) {
      throw new Error(`Unsupported workspace glob ${glob}: use a path or "folder/*".`);
    }
    return [glob];
  });
  return dirs.filter((dir) => existsSync(join(root, dir, "package.json"))).sort();
}
