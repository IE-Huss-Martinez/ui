# 0005. An icon set generated from Lucide

- **Status:** Accepted
- **Date:** 2026-11-12

## Context

`sdk-core`'s [ADR 0030](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0030-tools-and-keyboard-shortcuts.md) gives every tool an `icon`: "the name of an icon from `ui`'s icon set". `ui` has no icon set. So far, every component takes icons as elements from the host, and the catalogue draws its own samples. The SDKs' toolbars are about to need the same few dozen glyphs: undo, zoom, rotate, play, loop, split, pen, and so on. Without a shared set, each SDK would draw or copy its own, and the family would look inconsistent.

The set has to fit the family's rules:

- **Tree-shaking.** An application ships only the icons its SDKs use ([ADR 0004](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0004-entry-points-and-module-format.md)).
- **No network** ([ADR 0012](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0012-hostile-input-and-no-network.md)) and a strict Content Security Policy: no sprite files to fetch, no inline styles.
- **`currentColor`,** so icons follow every theme ([ADR 0006](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0006-design-tokens-and-theming.md)), and no hard-coded text ([ADR 0014](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0014-accessibility-and-translatable-text.md)).
- **Supply chain:** every dependency must be justified, with a one-day release age and provenance that can't be downgraded. Code generated from a third party's files must be safe even if a release is compromised.

## Decision

### Source: Lucide, generated at development time

- **The glyphs come from [Lucide](https://lucide.dev)**, through the pinned devDependency `lucide-static`. It has about 2,000 icons on a 24 px grid, drawn with 2 px rounded strokes, which matches `ui`'s look and the catalogue's samples. It's published with npm provenance and has no dependencies.
- **The licence:** Lucide is under the ISC licence, and the icons it derived from Feather are under MIT. Both notices ship in the package, in `THIRD_PARTY_NOTICES.md`, and in a legal comment at the top of the generated module, which the build keeps.
- **A script generates the components.** `pnpm --filter @hussmartinez/ui icons` reads `lucide-static`'s `icon-nodes.json`, which is structured element data rather than SVG markup. It writes the components into `src/icons/`, and the output is committed. A test fails when the output is stale. `lucide-static` is never a runtime dependency, and no Lucide code ships.
- **The generator validates everything before it writes:**
  - only the elements `path`, `circle`, `rect`, `line`, `ellipse`, `polyline` and `polygon`;
  - only their geometry attributes;
  - values that match a grammar of numbers and path commands.
  - Anything else fails generation: `style`, `href`, event handlers, `<use>`, `<foreignObject>` or a stray character. A compromised release can't inject markup or script through the icons.
- **Updates are visual changes.** Dependabot bumps `lucide-static` after the release-age delay. Regenerating shows any changed glyph in the catalogue's icon story and in the visual baselines, and it's reviewed like any other visual change.

### Names: `ui`'s own

- **Every icon has a `ui` name,** in kebab-case, describing its use in the family rather than its drawing: `undo`, `rotate-left`, `zoom-in`, `page-grid`, `play`, `loop`, `split`.
- **A manifest, `src/icons/manifest.ts`, maps each name to a Lucide glyph,** with a flag for icons that mirror in right-to-left text. Lucide renames glyphs between releases (`trash-2` is now `trash`), and `ui`'s names stay the same, so a rename or a change of source never breaks the SDKs.
- **The component** for each name is `<PascalCase>Icon`, such as `RotateLeftIcon`. The `IconName` type is the union of all names; it's what ADR 0030's `icon` field holds.

### Format: one React component per icon

- **The components are in `./react`.** Each is a named, `/* @__PURE__ */`-annotated export, so a bundler keeps only the ones imported. `build.test.ts` checks that one icon ships without any other icon's path data. An icon costs about 140 bytes, minified and compressed.
- **`ui` provides no name-to-component registry.** A registry would ship every icon to every application. An SDK's React layer maps the names its tools use to components, as a typed `Partial<Record<IconName, IconComponent>>`, so it imports only those icons. The tool definitions stay headless data, as ADR 0030 requires.
- **The rendered markup:**
  - `<svg class="hm-icon">` with a 24-unit `viewBox`, `fill="none"`, `stroke="currentColor"`, a stroke width of 2 and round caps and joins;
  - decorative by default, with `aria-hidden="true"` and `focusable="false"`; buttons and tools name themselves, as `IconButton` does through `label`;
  - for an icon that carries meaning on its own, `label` makes it `role="img"` with that accessible name, and the text comes from the host's messages.
  - Icons take `className`. They have no `unstyled`, because they have no visual styles beyond size and colour.
- **Size and direction come from CSS:**
  - `.hm-icon` sizes to `--hm-icon-size` in `hm.components`, and inside a button's icon slot it follows the slot;
  - directional icons, such as undo, redo and arrows that point along the reading order, carry `data-hm-mirror` and flip under `:dir(rtl)`. Media icons, such as play and skip, don't mirror, as platform guidelines advise.
- **Non-React rendering** isn't needed yet. If the custom elements of [sdk-core's ADR 0036](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0036-ui-as-a-dependency-of-the-sdks.md) need icons without React, the generator can also emit the node data, and a later record adds it.

### The first set

The first set covers what `pdf-sdk`'s and the audio SDK's toolbars need, plus common interface icons: undo, redo, zoom in and out, rotate left and right, delete, download, upload, open, play, pause, stop, loop, skip back and forward, volume and muted, split, pen, highlighter, select, pan, single page, page grid, close, the chevrons, add, remove, check, warning, information, search, more and menu. That's 37 icons, about 1.6 kB compressed if all were imported. Icons are added on demand, one manifest entry each, in a pull request.

## Alternatives considered

- **`lucide-react` as a runtime dependency:** it adds a dependency to every SDK and application, with its own React wrapper, props and update pace. We wouldn't control the output markup, accessibility defaults or names.
- **Tabler Icons:** these are MIT, larger, similar in style and also have provenance. Lucide's smaller, more consistent set and wider use won by a small margin. The manifest keeps a switch possible without breaking `ui`'s names.
- **Heroicons, Phosphor and Material Symbols:**
  - Heroicons is too small for media and editing tools;
  - Phosphor publishes without provenance;
  - Material Symbols is fill-based and mainly distributed as a font.
- **An SVG sprite with `<use href>`:** it needs a hosted file, which means a request and a URL to configure, and `<use>` across origins is fragile. It also can't be tree-shaken.
- **An icon font:** it needs a font file, which is never fetched under the family's rules. Fonts render inconsistently and are poor for accessibility, because they need extra work to hide their glyphs from screen readers.
- **Drawing our own:** it's slow and expensive, and hard to keep consistent across dozens of glyphs.
- **A `<Icon name="…">` component with a registry:** it's convenient, but every application would ship every icon, and the cost grows with the set.

## Consequences

- SDK toolbars share one consistent icon language. A tool names its icon, and the SDK imports exactly the icons it uses.
- `ui` gains a development-time generator and a devDependency, with a test that keeps the committed output equal to the pinned source and inside the allowlist.
- Lucide's updates reach `ui` only through a reviewed regeneration, never at install time.
- **Follow-up work:**
  - generate the first set, with a catalogue story showing every icon in every theme;
  - replace the catalogue's hand-drawn samples with the set;
  - document the `IconName` mapping pattern for SDK authors in the README.
