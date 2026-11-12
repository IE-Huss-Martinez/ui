import { readdir, readFile } from "node:fs/promises";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/** The guard every warning sits in, so bundlers drop it in production. */
const GUARD = 'typeof process !== "undefined" && process.env.NODE_ENV !== "production"';

const SOURCE = new URL("../", import.meta.url);

/** The published source files: TypeScript outside tests. */
async function sourceFiles(): Promise<string[]> {
  const entries = await readdir(SOURCE, { recursive: true });
  return entries.filter((entry) => /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry));
}

/** Whether a node sits in the `then` branch of an `if` on exactly the guard. */
function isGuarded(node: ts.Node, file: ts.SourceFile): boolean {
  for (let child = node, parent = node.parent; parent; child = parent, parent = parent.parent) {
    if (
      ts.isIfStatement(parent) &&
      parent.thenStatement === child &&
      parent.expression.getText(file).replace(/\s+/g, " ") === GUARD
    ) {
      return true;
    }
  }
  return false;
}

/** Every call to a function with one of `names`, by file and line. */
async function callsTo(names: string[]): Promise<{ where: string; guarded: boolean }[]> {
  const calls: { where: string; guarded: boolean }[] = [];
  for (const path of await sourceFiles()) {
    const text = await readFile(new URL(path, SOURCE), "utf8");
    const kind = path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, kind);
    const visit = (node: ts.Node): void => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        names.includes(node.expression.text)
      ) {
        const { line } = file.getLineAndCharacterOfPosition(node.getStart(file));
        calls.push({ where: `${path}:${line + 1}`, guarded: isGuarded(node, file) });
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
  return calls;
}

describe("development warnings", () => {
  it("are all called inside the inline guard, so production bundles drop them", async () => {
    const calls = await callsTo(["warnInDevelopment"]);
    // The scan found the calls, so a renamed helper can't make it pass empty.
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.filter((call) => !call.guarded).map((call) => call.where)).toEqual([]);
  });

  it("never gate code on isDevelopment(), which bundlers can't fold", async () => {
    // Only warnInDevelopment's own runtime check may call it.
    const calls = await callsTo(["isDevelopment"]);
    expect(calls.map((call) => call.where.replace(/:\d+$/, ""))).toEqual([
      "internal/development.ts",
    ]);
  });
});
