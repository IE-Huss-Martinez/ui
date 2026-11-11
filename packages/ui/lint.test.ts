import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../", import.meta.url));

/** Lints CSS through the workspace's stylelint CLI, as if it were at `path`. */
function lintAs(path: string, css: string): { status: number | null; output: string } {
  const result = spawnSync(
    "pnpm",
    ["exec", "stylelint", "--stdin", "--stdin-filename", path, "--allow-empty-input"],
    { cwd: root, input: css, encoding: "utf8" },
  );
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

// A literal colour: fine in generated output, an error in source.
const LITERAL = ".hm-probe { color: #f00; }\n";

describe("pnpm lint:css", () => {
  it.each([
    "packages/ui/dist/styles.css",
    "packages/ui/temp/styles.css",
    "packages/ui/coverage/styles.css",
    "apps/catalogue/storybook-static/main.css",
    "examples/next/.next/static/css/app.css",
    "examples/vite/dist-server/assets/app.css",
  ])("ignores build and tool output, such as %s", (path) => {
    expect(lintAs(path, LITERAL)).toMatchObject({ status: 0 });
  });

  it("still lints source files", () => {
    const result = lintAs("packages/ui/src/probe.css", LITERAL);
    expect(result.status).not.toBe(0);
    expect(result.output).toContain("hm/no-literal-values");
  });
});
