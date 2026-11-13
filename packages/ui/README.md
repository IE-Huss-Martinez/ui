# @hussmartinez/ui

[![npm version of @hussmartinez/ui](https://img.shields.io/npm/v/@hussmartinez/ui)](https://www.npmjs.com/package/@hussmartinez/ui) [![Verify workflow status on main](https://github.com/ie-huss-martinez/ui/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/ie-huss-martinez/ui/actions/workflows/verify.yml?query=branch%3Amain) [![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](https://github.com/ie-huss-martinez/ui/blob/main/LICENSE)

The design system of the `@hussmartinez` SDK family: design tokens, themes, base styles and accessible React components. Every SDK's editor uses it, and standalone applications can too.

> Status: `0.x`, so the API may still change between minor versions. Tokens, theming and the first components are available; more components are on the way.

## Install

```sh
npm install @hussmartinez/ui
```

For the React components, your application also needs `react` and `react-dom` 18.3 or later. They're optional peer dependencies, so the tokens and theme helpers work without them.

## Quick start

Import the stylesheet once, at the root of your application, and use the components:

```tsx
import "@hussmartinez/ui/styles.css";
import { Button, ThemeProvider } from "@hussmartinez/ui/react";

export function App() {
  return (
    <ThemeProvider mode="system">
      <Button variant="primary">Save</Button>
    </ThemeProvider>
  );
}
```

`mode="system"` follows the operating system's light or dark preference, in CSS, so nothing flashes on load. Without `ThemeProvider`, the page follows the system preference too; the provider is for a forced mode, a density or a custom theme.

## Entry points

The package is ESM only ([ADR 0004](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0004-entry-points-and-module-format.md)).

| Entry | Contents |
|---|---|
| `@hussmartinez/ui` | Tokens, `createTheme`, `themeToCss`, the built-in themes and their types. No React and no DOM access on import, so it's safe in Server Components and build scripts |
| `@hussmartinez/ui/react` | `ThemeProvider`, `UiMessagesProvider` and the components. Starts with `"use client"`. React and React DOM `>=18.3` are optional peer dependencies |
| `@hussmartinez/ui/styles.css` | All styles: the built-in tokens and base styles, in the cascade layers `hm.tokens` and `hm.base`. Import it once in your application |

JavaScript never imports CSS, so your application decides where the stylesheet loads. Your own unlayered CSS overrides every `hm` layer without `!important` ([ADR 0005](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0005-plain-css-with-cascade-layers.md)).

## Tokens

Every visual value is a CSS custom property, such as `--hm-color-accent` or `--hm-radius-control`. Base tokens are raw scales; semantic tokens name a purpose, and are the ones to use. The [token reference](https://github.com/ie-huss-martinez/ui/blob/main/packages/ui/docs/tokens.md) lists them all, with their light, dark and compact values.

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

`data-hm-theme` takes `light`, `dark` or `system`, and `data-hm-density` takes `comfortable` (the default) or `compact`. On touch screens, targets are 44 px in either density. A themed subtree also sets its text colour to `--hm-color-text`, in the lowest-priority layer, so your own CSS still wins. Backgrounds are left to you: paint them with `--hm-color-bg` or `--hm-color-surface`.

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

## Server rendering and frameworks

Every component renders on the server and hydrates without warnings; end-to-end tests check it in a Next.js App Router application and a server-rendered Vite application ([ADR 0007](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0007-server-rendering-and-nextjs.md)). Nothing touches the browser when either entry is imported.

- **Next.js Server Components** can import `@hussmartinez/ui` (tokens, `createTheme`, `themeToCss`) and render components from `@hussmartinez/ui/react` directly, as long as they pass no functions. Put components that need callbacks, such as `Dialog`, in a client component.
- **Custom themes in Server Components:** a theme passed to a client component is serialised, so `ThemeProvider` can't receive one from a Server Component. Write it as CSS instead, `<style>{themeToCss(theme, ".brand")}</style>`, or create the theme in a client module.
- **Vite** may print "module level directive may not be preserved" for `@hussmartinez/ui/react`. It's harmless: `"use client"` only matters to frameworks with Server Components.

## Content Security Policy

- **The built-in themes** need no inline styles: `styles.css` and the `data-hm-*` attributes are enough.
- **`ThemeProvider` with a custom theme** renders a `<style>` element. Allow it with a nonce, `style-src 'self' 'nonce-…'`, and pass the same nonce to the `nonce` prop.
- **A strict policy without nonces:** generate the theme with `themeToCss` at build time and serve it as a stylesheet, then use `ThemeProvider` without `theme`, or plain `data-hm-*` attributes.

No styles are evaluated as JavaScript, and nothing needs `unsafe-eval`.

## Files from users

`FileDropZone` hands you `File` objects. Treat each one as untrusted:

- **`accept` is a hint, not a check.** A file's name and type are whatever its sender chose, so the zone's checks only spare people an obvious mistake. Check the contents, and the size, before using a file, as each SDK's file policy does.
- **Show names as text.** Render `file.name` as a React text child, never through `dangerouslySetInnerHTML` or `innerHTML`. The zone itself never shows a name.
- **Read in your own code.** The zone never reads a file, so reading, and its limits, stay under your control.

## Components

Every component follows one contract ([ADR 0003](https://github.com/ie-huss-martinez/ui/blob/main/docs/adr/0003-component-contract.md)):

- **Styling:** `className` on the root, `classNames` per named part, and stable `.hm-*` classes to target. `unstyled` drops colours, borders, typography and motion, and keeps layout, focus rings and target sizes.
- **Theming:** component tokens, such as `--hm-button-radius`, fall back to semantic tokens. Set them on any ancestor.
- **Refs and props:** refs reach the root element, and native props pass through.
- **Text:** text props, falling back to `UiMessagesProvider`.

| Component | Use it for |
|---|---|
| `Button` | Actions. `variant` is `primary`, `secondary` (default), `quiet` or `danger`; `size` is `medium` or `small`; `pressed` shows a toggle state you control, as `ToggleButton` does; `startIcon` and `endIcon` take icons |
| `IconButton` | Icon-only actions. `label` is required: it's the accessible name |
| `ToggleButton` | Turning something on or off, such as loop or the active tool, exposed as `aria-pressed`. `variant` is `secondary` (default) or `quiet`. Controlled with `pressed` and `onPressedChange`, or uncontrolled from `defaultPressed`. Text children, or `icon` with a required `label`. The label stays the same in both states, so a button whose label changes, such as play and pause, is an `IconButton` that swaps its `label` |
| `VisuallyHidden` | Text for assistive technology only |
| `Toolbar`, `ToolbarGroup`, `ToolbarSeparator` | A row or column of controls with one Tab stop: arrow keys move between items, Home and End jump to the ends. `label` is required on the toolbar and its groups |
| `SegmentedControl` | A few mutually exclusive choices side by side. A radio group: arrow keys move and select. Inside a `Toolbar`, it joins the toolbar's arrow keys, and Space or Enter selects |
| `FileDropZone` | Choosing or dropping files, such as a document to open. Its button opens the system's file picker and is the keyboard and screen reader path; the zone around it takes drops from a pointer, with `data-hm-dragging` while files are over it. `accept` and `multiple` are checked by name, type and count, and folders are turned away; `onFiles` gets the rest, and `onFilesRejected` the others, with a reason. It never reads a file or shows its name, and while it's on the page, a file dropped beside it doesn't open in place of the page; `preventStrayDrops={false}` leaves that to you |
| `Dialog` | A modal dialog on the native `<dialog>`: focus moves in and is trapped, the page behind is inert, Escape asks to close through `onOpenChange(false)`, and focus returns to the opener. Controlled by `open`; labelled by `title`. Long content scrolls in the body, which becomes keyboard-scrollable when it overflows |
| `Spinner` | Loading for an unknown time. An indeterminate progress bar to assistive technology, named by `label`; its size follows `--hm-spinner-size` |
| `ProgressBar` | Progress for a known amount, on the native `<progress>`: `value`, `max`, `label`, `valueText`. Indeterminate without `value`. It needs no inline styles, so it works under a strict Content Security Policy |
| `Field` | A visible `label`, an optional `description` and an optional `error`, wired to one control: the label names it, the description and error describe it, and an error marks it `aria-invalid`. `Slider` and `NumberField` connect themselves; for a native `<input>` or `<select>`, pass a function and spread the props it receives |
| `NumberField` | A number typed as text, exposed as a spin button. Typing is committed on blur or Enter and kept within `min` and `max`; text that isn't a number goes back to the last value, so `onValueChange` never receives `NaN`. Arrow Up and Down step by `step`, Page Up and Down by `largeStep`, and Escape throws the typing away. `parse` and `format` default to the `locale`, or `UiMessagesProvider`'s, digits and separators included; replace them for units or a timecode. With `name`, forms receive the number |
| `Slider` | A value in a range, such as volume or zoom, on the native `<input type="range">`: `value` or `defaultValue`, `onValueChange`, `min`, `max`, `step` and `largeStep`. `formatValue` gives screen readers the value as text, such as "−6 dB". Arrow keys, Page Up and Down, Home and End work the same in every browser, mirrored in right-to-left text. In a `Toolbar`, it keeps the arrow keys, so put it last |
| `AnnouncerProvider`, `useAnnounce` | Announcements for screen readers, such as "Saved 1.3 MB": `announce(message, { politeness })`. The provider renders the live regions once, on the server too |
| `usePlatform` | The platform for keyboard shortcuts: `"apple"` on macOS, iOS and iPadOS, where `Mod` is ⌘, otherwise `"other"`. It's `"other"` on the server and during hydration, then Apple devices switch right after, so hydration never mismatches. Pass it to sdk-core's `createShortcutRegistry({ platform })`, and never read `navigator` during render for this |
| `Tooltip` | Short text about a control, shown on hover and on keyboard focus; Escape closes it (WCAG 1.4.13). `type="label"` makes it an icon-only button's name, and `description`, the default, describes the button. `shortcut` takes sdk-core's `registry.describe(toolId)[0]`, shows it in the platform's notation (⌘⇧Z or Ctrl+Shift+Z) and sets `aria-keyshortcuts`. It's in the top layer, so no stacking context hides it. Disabled triggers need `focusableWhenDisabled` |

```tsx
import { Button, DownloadIcon, IconButton, RotateLeftIcon } from "@hussmartinez/ui/react";

<Button variant="primary" startIcon={<DownloadIcon />} onClick={save}>
  {messages.t("toolbar.download")}
</Button>
<IconButton label={messages.t("toolbar.rotate")} icon={<RotateLeftIcon />} onClick={rotate} />
```

Pass ui's icons, below, or any element that draws with `currentColor`. Each component costs a few hundred bytes minified and compressed, and a bundler drops the ones you don't import.

### Icons

ui has its own icon set, generated from [Lucide](https://lucide.dev) ([ADR 0005](https://github.com/ie-huss-martinez/ui/blob/main/docs/adr/0005-icon-set.md)). Each icon is a component named after its use in the SDK family, such as `UndoIcon`, `RotateLeftIcon`, `PlayIcon` or `PageGridIcon`; the catalogue shows them all.

```tsx
import { IconButton, RotateLeftIcon } from "@hussmartinez/ui/react";

<IconButton label={messages.t("toolbar.rotateLeft")} icon={<RotateLeftIcon />} />;
```

- **Size and colour:** icons draw with `currentColor` and size to `--hm-icon-size`; in a button's icon slot, the slot sets the size.
- **Accessibility:** icons are decorative and hidden from assistive technology, as they should be inside a labelled button. For an icon that means something on its own, pass `label`, from your message catalogue, and it becomes a named image.
- **Right to left:** icons that point along the reading direction, such as undo and redo, mirror in right-to-left text.
- **Only what you import ships:** each icon is its own export, about 140 bytes compressed.
- **Icons by name:** tools refer to icons by their `IconName`, such as `"rotate-left"` (sdk-core ADR 0030). ui has no name-to-component registry, which would ship every icon, so map the names your tools use:

  ```tsx
  import type { IconComponent, IconName } from "@hussmartinez/ui/react";
  import { RotateLeftIcon, UndoIcon } from "@hussmartinez/ui/react";

  const toolIcons: Partial<Record<IconName, IconComponent>> = {
    undo: UndoIcon,
    "rotate-left": RotateLeftIcon,
  };
  ```

- **Licence:** Lucide's ISC licence, and the MIT licence of its icons derived from Feather, are in `THIRD_PARTY_NOTICES.md` in the package.

### Text

Components never contain inline text. Text props win; otherwise, components read `UiMessagesProvider`, which takes an sdk-core `Messages` object whose catalogue includes `uiMessages`:

```tsx
const messages = createMessages({ ...sdkCoreMessages, ...uiMessages, ...yourMessages }, { locale });

<UiMessagesProvider messages={messages}>
  <App />
</UiMessagesProvider>
```

## Using ui from an SDK

The `@hussmartinez` SDKs build their editors from ui's components, so an application using an SDK already has ui ([ADR 0036](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0036-ui-as-a-dependency-of-the-sdks.md)).

- **One stylesheet, required.** Import `@hussmartinez/ui/styles.css` once, before the SDKs' stylesheets. The SDKs' stylesheets never include it, so it loads once however many SDKs you use. Don't leave it out: the focus rings and target sizes of the components inside an SDK live there.
- **One copy of ui.** Each `ui` copy has its own providers, so `UiMessagesProvider`, `ThemeProvider` and `AnnouncerProvider` from one copy don't reach components from another: their text falls back to English, and announcements are lost. If your application uses ui itself, depend on the same minor version as your SDKs; `npm ls @hussmartinez/ui` should list one version. In development, ui warns when a second copy is in use, and names the versions it found.
- **Providers once, at the root.** One `ThemeProvider` and `AnnouncerProvider` around your application reach ui's components inside every SDK too.
- **Text through the SDK's `messages`.** Inside an SDK, ui's own strings, such as `FileDropZone`'s "Choose a file" or `Dialog`'s "Close", come from the SDK's messages ([ADR 0046](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0046-ui-text-through-the-sdk.md)). Override or translate them through the SDK's `messages` prop, next to the SDK's own text: `{ "fileDropZone.choose": "Datei auswählen" }`. Your own `UiMessagesProvider` reaches only the ui components you render yourself.
- **Headless use.** An SDK's `.` entry never loads React or ui's React components; it may use ui's server-safe root entry, such as the `IconName` type. ui is installed with the SDK, but its `react` and `react-dom` peers are optional, so there are no peer warnings.

**For SDK authors:**

- **The dependency:** list ui in `dependencies` with a caret range on the current minor, such as `^0.4.0`, and import its components only from `features/`, `react/` and `element/`. `sdk-config`'s dependency-cruiser preset fails the build when the core, an adapter or a worker imports ui, or when anything the `.` entry reaches imports React or ui's React entry.
- **The catalogue:** spread `uiMessages` into your catalogue, next to `sdkCoreMessages`, and pass the one `Messages` object you create with the host's locale and overrides to `UiMessagesProvider` around everything you render. Don't create a second, ui-only object, or hosts can't translate ui's strings.

  ```ts
  export const myMessages = defineMessages({ ...sdkCoreMessages, ...uiMessages, ...ownMessages });
  ```

- **Key collisions:** keep a test that your own keys don't overlap `sdkCoreMessages` or `uiMessages`, so a later release can't silently replace your text. ui's keys use component names as prefixes, such as `dialog.` and `fileDropZone.`.

## Errors and messages

Errors are `UiError`s, subclasses of sdk-core's `SdkError`, with a stable `code` and `details`. `uiMessages` has English text for each code; spread it into your catalogue next to `sdkCoreMessages`:

```ts
import { createMessages, defineMessages, sdkCoreMessages } from "@hussmartinez/sdk-core";
import { uiMessages } from "@hussmartinez/ui";

const messages = createMessages(defineMessages({ ...sdkCoreMessages, ...uiMessages }));
messages.error(error); // "The theme setting color-accent has a value that can't be used."
```

## License

[Apache-2.0](https://github.com/ie-huss-martinez/ui/blob/main/LICENSE)
