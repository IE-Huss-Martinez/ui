import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * Everything the server-safe `.` entry reaches, types included: a TypeScript
 * program rooted at src/index.ts, with no automatic `@types` packages and no
 * implicit JSX runtime, so a declaration file is only in it when something
 * imports it. .tsx modules the entry reaches are in it too.
 */
function filesTheEntryReaches(): string[] {
  const configFile = fileURLToPath(new URL("tsconfig.json", import.meta.url));
  const parsed = ts.getParsedCommandLineOfConfigFile(
    configFile,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
      },
    },
  );
  if (!parsed) {
    throw new Error("Can't read tsconfig.json");
  }
  const entry = fileURLToPath(new URL("src/index.ts", import.meta.url));
  // JSX preserved: with `jsx: react-jsx`, TypeScript adds an implicit
  // react/jsx-runtime import to every module, which isn't a real edge. Turning
  // JSX off instead would drop .tsx modules from the program, and hide them.
  const program = ts.createProgram([entry], {
    ...parsed.options,
    types: [],
    jsx: ts.JsxEmit.Preserve,
    noEmit: true,
  });
  return program.getSourceFiles().map((file) => file.fileName);
}

describe("the server-safe entry", () => {
  it("reaches no React, not even its types (sdk-core ADR 0036)", () => {
    const files = filesTheEntryReaches();
    // The program saw the entry's own modules, so an empty graph can't pass.
    expect(files.some((file) => file.endsWith("/src/theme/create-theme.ts"))).toBe(true);
    expect(
      files.filter((file) => /\/node_modules\/(?:@types\/)?react(?:-dom)?\//.test(file)),
    ).toEqual([]);
  });
});
