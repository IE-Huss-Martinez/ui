import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

/** One built file per public entry point (ADR 0004). */
export const entries = {
  index: "src/index.ts",
  react: "src/react.ts",
  styles: "src/styles.css",
} as const;

const entryFiles = new Set(
  Object.values(entries).map((entry) => fileURLToPath(new URL(entry, import.meta.url))),
);

// Library build: unminified ES modules with source maps, so that consumers'
// bundlers can tree-shake and minify them, and one stylesheet that bundles
// every CSS file it imports. No JavaScript imports CSS.
export default defineConfig({
  build: {
    lib: {
      entry: entries,
      formats: ["es"],
    },
    // Required for a CSS file as an entry; it's then emitted as its own file.
    cssCodeSplit: true,
    target: "es2022",
    minify: false,
    sourcemap: true,
    rolldownOptions: {
      onLog(level, log, handler) {
        // Rolldown always keeps a top-level directive in an entry module, which
        // is how "use client" stays at the top of dist/react.js (ADR 0007).
        // Its warning only matters for directives in other modules, so it's
        // kept for those. build.test.ts checks the built entries.
        if (log.code === "MODULE_LEVEL_DIRECTIVE" && log.id && entryFiles.has(log.id)) {
          return;
        }
        handler(level, log);
      },
    },
  },
});
