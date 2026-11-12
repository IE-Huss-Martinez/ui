# Catalogue

The component catalogue of `@hussmartinez/ui`, built with Storybook ([ADR 0022](https://github.com/IE-Huss-Martinez/sdk-core/blob/main/docs/adr/0022-storybook-for-the-component-catalogue.md)). It isn't published.

```sh
pnpm --filter @hussmartinez/ui-catalogue dev     # http://localhost:6006
pnpm --filter @hussmartinez/ui-catalogue build   # static build in storybook-static/
```

- **Toolbar:** switch the theme (light, dark, system, and the Poster demo theme in light and dark) and the density. Every story renders inside `ThemeProvider`.
- **Source, not the build:** stories import `@hussmartinez/ui` from its source, so changes show up immediately.
- **Poster** ([`src/themes/poster.ts`](src/themes/poster.ts)) is a deliberately unusual theme, used only here and in the visual tests: square corners, a monospace face, a vermilion accent, thick borders and hard shadows. A component that hard-codes a value looks wrong in it straight away.
- **Tests:**
  - every story runs as a test on Chromium, Firefox and WebKit, and fails on any axe violation;
  - visual tests render every story in light, dark and Poster light, in both densities, inside a pinned Playwright image ([ADR 0002](../../docs/adr/0002-visual-regression-in-a-pinned-container.md)).
- **No network requests:** Storybook's telemetry is off.
