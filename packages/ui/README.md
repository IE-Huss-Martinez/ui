# @hussmartinez/ui

The design system of the `@hussmartinez` SDK family: design tokens, themes, base styles and accessible React components. Every SDK's editor uses it, and standalone applications can too.

> Status: not published yet. Tokens and theming are in place; components come next.

## Entry points

The package is ESM only ([ADR 0004](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0004-entry-points-and-module-format.md)).

| Entry | Contents |
|---|---|
| `@hussmartinez/ui` | Tokens, `createTheme`, `themeToCss`, the built-in themes and their types. No React and no DOM access on import, so it's safe in Server Components and build scripts |
| `@hussmartinez/ui/react` | `ThemeProvider` and, later, components. Starts with `"use client"`. React and React DOM `>=18.3` are optional peer dependencies |
| `@hussmartinez/ui/styles.css` | All styles: the built-in tokens and base styles, in the cascade layers `hm.tokens` and `hm.base`. Import it once in your application |

JavaScript never imports CSS, so your application decides where the stylesheet loads. Your own unlayered CSS overrides every `hm` layer without `!important` ([ADR 0005](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0005-plain-css-with-cascade-layers.md)).

## Tokens

Every visual value is a CSS custom property, such as `--hm-color-accent` or `--hm-radius-control`. Base tokens are raw scales; semantic tokens name a purpose, and are the ones to use. The [token reference](https://github.com/hussmartinez/ui/blob/main/packages/ui/docs/tokens.md) lists them all, with their light, dark and compact values.

```css
.my-panel {
  background: var(--hm-color-surface);
  border-radius: var(--hm-radius-surface);
  padding: var(--hm-inset-normal);
}
```

## Themes

With `styles.css` loaded, the built-in light and dark themes follow the operating system's preference, in pure CSS, so nothing flashes on load. Attributes change any subtree:

```html
<section data-hm-theme="dark">Always dark</section>
<section data-hm-theme="system">Follows the system again</section>
<aside data-hm-density="compact">Tighter controls</aside>
```

`data-hm-theme` takes `light`, `dark` or `system`, and `data-hm-density` takes `comfortable` (the default) or `compact`. On touch screens, targets are 44 px in either density.

### Custom themes

`createTheme` validates a set of token values. Extend a built-in theme and change only what you need, or set every semantic token to replace the look entirely.

```ts
import { createTheme } from "@hussmartinez/ui";

export const brandLight = createTheme({
  extends: "light",
  tokens: { "color-accent": "#5b21b6", "radius-control": "0" },
});
export const brandDark = createTheme({
  extends: "dark",
  tokens: { "color-accent": "#c4b5fd", "radius-control": "0" },
});
```

- **Validation:** every value is checked against its token's type and an allowlist grammar, so a value can't break out of its CSS, even when it comes from a user. Invalid values throw `UiError` with the code `INVALID_THEME_TOKEN`. Show users the text from `uiMessages`, never the error's `message`.
- **Contrast:** in development, `createTheme` warns when text, boundary or focus colours fall below WCAG 2.2 AA contrast. `checkContrast(theme)` returns the same report, for checking colours users choose.

There are two ways to apply a theme.

**`ThemeProvider`** applies a theme, a colour mode and a density to everything inside it. It renders on the server, so there's no flash before hydration. Create themes once, at module level, not during render.

```tsx
import { ThemeProvider } from "@hussmartinez/ui/react";

<ThemeProvider theme={{ light: brandLight, dark: brandDark }} mode="system" density="compact">
  <App />
</ThemeProvider>;
```

Without `theme`, it applies the built-in themes. `mode` is `light`, `dark` or `system`. Themes must come from `createTheme`; pass one loaded as JSON through `createTheme` first. An application that uses only the built-in themes doesn't ship the theme validator: `ThemeProvider` on its own is about 1 kB, minified and compressed.

**`themeToCss`** writes a theme as a static stylesheet, at build time or on the server:

```ts
import { themeToCss } from "@hussmartinez/ui";

const css = themeToCss({ light: brandLight, dark: brandDark }); // applies to :root
const scoped = themeToCss(brandLight, ".marketing"); // only inside .marketing
```

Custom themes always beat the built-in ones, whatever order stylesheets load in. Themes can nest; the closest one wins. Invalid selectors throw `UiError` with the code `INVALID_THEME_SELECTOR`.

## Content Security Policy

- **The built-in themes** need no inline styles: `styles.css` and the `data-hm-*` attributes are enough.
- **`ThemeProvider` with a custom theme** renders a `<style>` element. Allow it with a nonce, `style-src 'self' 'nonce-…'`, and pass the same nonce to the `nonce` prop.
- **A strict policy without nonces:** generate the theme with `themeToCss` at build time and serve it as a stylesheet, then use `ThemeProvider` without `theme`, or plain `data-hm-*` attributes.

No styles are evaluated as JavaScript, and nothing needs `unsafe-eval`.

## Errors and messages

Errors are `UiError`s, subclasses of sdk-core's `SdkError`, with a stable `code` and `details`. `uiMessages` has English text for each code; spread it into your catalogue next to `sdkCoreMessages`:

```ts
import { createMessages, defineMessages, sdkCoreMessages } from "@hussmartinez/sdk-core";
import { uiMessages } from "@hussmartinez/ui";

const messages = createMessages(defineMessages({ ...sdkCoreMessages, ...uiMessages }));
messages.error(error); // "The theme setting color-accent has a value that can't be used."
```

## License

[Apache-2.0](https://github.com/hussmartinez/ui/blob/main/LICENSE)
