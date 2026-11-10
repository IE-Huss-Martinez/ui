import { fileURLToPath } from "node:url";
import type { Alias } from "vite";

const ui = (path: string): string =>
  fileURLToPath(new URL(`../../packages/ui/${path}`, import.meta.url));

/**
 * Resolves @hussmartinez/ui to its source, so the catalogue reloads as the
 * package changes. The built package is checked separately, by the package's
 * own build tests, publint and attw.
 */
export const uiSourceAliases: Alias[] = [
  { find: /^@hussmartinez\/ui$/, replacement: ui("src/index.ts") },
  { find: /^@hussmartinez\/ui\/react$/, replacement: ui("src/react.ts") },
  { find: /^@hussmartinez\/ui\/styles\.css$/, replacement: ui("src/styles.css") },
];
