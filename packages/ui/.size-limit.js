/**
 * Size budgets per entry point (ADR 0015): the brotli size of each built
 * entry, with the shared chunks it loads. They measure the unminified files in
 * dist, an upper bound: applications ship less, because their bundler
 * minifies and drops what they don't import.
 */
export default [
  {
    name: "Server-safe entry (.), with the shared code it loads",
    path: ["dist/index.js", "dist/shared/*.js"],
    brotli: true,
    // 12 kB. At 0.1.0 it measures 11 kB. Each module compressed on its own,
    // in kB:
    //   theme/css-value.ts      2.6  the injection allowlist and type grammars
    //   tokens/definitions.ts   2.1  token metadata behind the `tokens` export
    //   theme/color.ts          1.6  colour parsing and WCAG contrast
    //   theme/css-writer.ts     1.5  the selector allowlist and CSS writer
    //   theme/create-theme.ts   1.5  validation, extends, built-in themes
    //   tokens/themes.ts        0.9  built-in semantic values
    //   tokens/base.ts          0.7  built-in base values
    //   the rest                1.2  contrast pairs and check, messages,
    //                                errors, registry, themeToCss
    // An application using only the built-in themes ships none of this: see
    // the ThemeProvider tree-shaking test in build.test.ts.
    limit: "12 kB",
  },
  {
    name: "React entry (./react), with the shared code it loads",
    path: ["dist/react.js", "dist/shared/*.js"],
    brotli: true,
    // Room for the components to come; ThemeProvider alone is about 1 kB.
    limit: "15 kB",
  },
  {
    name: "Stylesheet (./styles.css)",
    path: "dist/styles.css",
    brotli: true,
    limit: "8 kB",
  },
];
