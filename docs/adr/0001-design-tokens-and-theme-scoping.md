# 0001. Design tokens, theme layers and theme scoping

- **Status:** Accepted
- **Date:** 2026-11-10

## Context

[ADR 0006](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0006-design-tokens-and-theming.md) decides that `ui` defines three levels of design tokens in one TypeScript source, with built-in light and dark themes, `system` mode in pure CSS, `data-hm-theme` and `data-hm-density` attributes, and `createTheme`, `ThemeProvider` and `themeToCss` for custom themes. [ADR 0005](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0005-plain-css-with-cascade-layers.md) fixes the cascade layers `hm.tokens`, `hm.base`, `hm.components` and `hm.sdk`. Implementing them raised questions those records leave open:

- **Custom properties resolve where they're declared.** If `:root` declares `--hm-color-text: var(--hm-gray-900)`, a subtree that changes `--hm-gray-900` still inherits the old `--hm-color-text`. The same trap catches component tokens that `ui` declares on a component's own element: a theme setting them higher up is ignored.
- **Custom themes and built-in themes compete.** Both set the same properties with selectors of similar specificity, so without a rule the order stylesheets load in decides which wins.
- **Themes nest.** A page can show an editor in one brand theme inside an application in another, and `data-hm-theme="dark"` inside each must pick that theme's dark variant.
- **Theme values can come from users,** such as a brand colour typed into a settings page, and they're written into `<style>` elements.

## Decision

### Token names

- **Names** are `--hm-<name>`. The TypeScript source uses the same names without the prefix, so one search finds a token in TypeScript, CSS and documentation.
- **Base tokens** are named by scale position: `gray-500`, `space-4`, `font-size-3`. Only other tokens use them.
- **Semantic tokens** are named by purpose: `color-text`, `radius-control`, `motion-duration-enter`. Components use only these and component tokens. [`packages/ui/docs/tokens.md`](../../packages/ui/docs/tokens.md) lists them all.
- **Component tokens** follow `--hm-<component>[-<variant>][-<part>]-<property>[-<state>]`, such as `--hm-button-primary-bg-hover`, with SDKs adding their kind: `--hm-pdf-thumb-radius`. **`ui` never declares them.** Component CSS reads each one with its semantic fallback, `var(--hm-button-radius, var(--hm-radius-control))`, so a theme or host can set it on any ancestor.
- **Density tokens** (control sizes, gaps and insets) are set by `data-hm-density`, never by the colour mode, so a dark subtree inside a compact one stays compact.
- **Coarse pointers** get 44 px targets in every density ([ADR 0014](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0014-accessibility-and-translatable-text.md)). Every theme carries its own coarse-pointer values, set with `createTheme`'s `coarsePointer` option and defaulting to 44 px. Without them, a custom theme that sets `control-height` would silently undo the touch targets inside its subtree, because the theme's own declaration beats the inherited built-in one.

### One source, generated outputs

- **The source** is `packages/ui/src/tokens`: definitions with each token's type and purpose, the built-in values, and the contrast pairs.
- **Generated and committed:** `src/tokens/tokens.css` and `docs/tokens.md`, written by `pnpm --filter @hussmartinez/ui tokens`. A unit test fails when they're stale.
- **Types** are derived from the source, not generated: the names are explicit unions, and compile-time checks keep them equal to the definitions.

### Two sublayers for tokens

`styles.css` declares, after the order of ADR 0005:

```css
@layer hm.tokens.default, hm.tokens.theme;
```

The built-in themes are in `hm.tokens.default`, and custom themes from `themeToCss` and `ThemeProvider` in `hm.tokens.theme`, so a custom theme always beats a built-in one, whatever order the stylesheets load in. `themeToCss` output starts with the same layer statements, because the first stylesheet that names a layer fixes its order. A host's unlayered CSS still beats every layer.

### `data-hm-theme="system"`

ADR 0006 lists `light` and `dark`. `system` is a third value: it makes a subtree follow `prefers-color-scheme` again inside a subtree that forces a mode, and it's what `ThemeProvider` renders in `system` mode.

### Scoping custom themes with `@scope`

- **Every block re-declares every token,** base tokens included, so references resolve again on the themed element.
- **`themeToCss(theme, selector)` wraps its rules in `@scope (selector)`.** When themes nest, `@scope` proximity makes the closest one win, whatever the source order.
- **`ThemeProvider`** renders a `display: contents` wrapper with `data-hm-theme-scope` set from `useId`, and a `<style>` element scoped to it.
- **Browser support:** `@scope` is within [ADR 0013](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0013-browser-and-react-support.md)'s support of the last two major versions. According to MDN's compatibility data, Chrome and Edge added it in 118, Safari in 17.4 and Firefox in 146.
  - **Safari 26.0 to 26.3** don't apply rules inside `@scope` to `<input>` and `<textarea>` elements; 26.4 fixed it. Themes are unaffected, because their rules match the scope root and `data-hm-*` elements, and form controls inherit the tokens. Component CSS must not style form controls from inside `@scope`.
  - **Verified:** proximity, with the outer theme's rules placed last in the source, in Chromium 158, Firefox 159 and WebKit 27.2, the engines of Playwright 1.65. The browser tests check it on every run.

### Values are allowlisted, not escaped

Every value passes a parser that accepts only identifiers, numbers with known units, hex colours, `,`, `/`, whitespace, a list of functions (colour functions, `calc`, `min`, `max`, `clamp`, easing functions and `var(--hm-*)`), and quoted font names made of letters, digits, spaces, `_`, `.` and `-`. Values are then checked against their token's type, and the CSS is written back from the parsed form. Selectors passed to `themeToCss` are allowlisted the same way. Generated CSS never contains `<`, which is what makes the one `dangerouslySetInnerHTML` in `ThemeProvider` safe. Invalid input throws `UiError` with `INVALID_THEME_TOKEN` or `INVALID_THEME_SELECTOR`.

### Contrast

The source lists the colour pairs that must meet WCAG 2.2 AA: 4.5:1 for text, and 3:1 for boundaries and focus indicators. A unit test requires every pair of every built-in theme to pass and to be computable. In development, `createTheme` warns about failing pairs, and about pairs it can't compute without a browser, such as `color-mix()`.

`checkContrast(theme)` is public and returns the same report in production, so hosts that let users choose colours, such as a brand colour, can reject or adjust them before applying the theme. `contrastPairs` exposes the pairs it checks.

### Applications ship only what they use

Most applications use only the built-in themes, so `ThemeProvider` must not pull in the validator, the colour maths or the token data:

- **`createTheme` registers each theme** it creates, with the function that writes it as CSS, in a small `WeakMap` registry. `ThemeProvider` imports only the registry; the CSS writer comes with the theme, from the application's own `createTheme` import. Themes stay plain frozen data.
- **Importing a module has no side effects.** Module-scope values are built by `/* @__PURE__ */` calls whose arguments are side-effect-free, so bundlers drop whatever isn't used, even within one chunk.
- **A test guards it:** it bundles `ThemeProvider` from the built package, minified and without the `sideEffects` field's help, and fails if the validator, the colour maths or the token data is included.

## Alternatives considered

- **Resolving `var()` references to literal values when generating:** avoids the resolution trap, but loses the link between semantic and base tokens that hosts and the token reference rely on, and doesn't help hosts who override tokens in their own CSS.
- **Declaring component tokens on the component element, defaulting to semantic tokens:** simple, but a theme can then only set them with selectors as specific as the component's.
- **Custom themes in `hm.tokens`, ordered by source:** breaks when a host's theme stylesheet loads before `styles.css`.
- **Nested themes with `:is()` selectors instead of `@scope`:** nesting would then depend on source order, so an outer theme loaded later would override an inner one.
- **Escaping values instead of allowlisting them:** escaping CSS correctly is subtle, and an escape that's missed is an injection. An allowlist fails closed.
- **`light-dark()` for colours:** handles colours only, not shadows or other tokens that differ by mode, and needs `color-scheme` set on every element, which `:root` rules can't do under the family's stylelint rules.

## Consequences

- Any visual difference between two applications can be expressed as token values, at any level of the page, and nested themes behave predictably.
- Custom theme CSS is larger than strictly needed, because every block re-declares every token. It compresses well, and correctness matters more here.
- `ui` depends on `@hussmartinez/sdk-core` at runtime for `SdkError` and the message helpers.
- **Descriptions stay out of the runtime API.** What each token is for lives in `src/tokens/descriptions.ts`, which no entry point imports; the generated token reference and the catalogue read it. The `tokens` export carries only names, levels, categories, types and fallbacks, because applications don't need prose at runtime and it grew the `.` entry with every component's tokens. This was changed before the first release, when it cost nothing.
- Values outside the allowlist are rejected even when they're valid CSS, such as named colours other than `black`, `white` and `transparent`. The grammar can be widened in a later release without breaking anyone.
