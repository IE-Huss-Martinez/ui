# @hussmartinez/ui

## 0.2.0

### Minor Changes

- [#30](https://github.com/ie-huss-martinez/ui/pull/30) [`21b9310`](https://github.com/ie-huss-martinez/ui/commit/21b93103be6582f99293c01b675313779a30b26b) Thanks [@hussmartinez](https://github.com/hussmartinez)! - Add `Field`, which wires a visible `label`, an optional `description` and an optional `error` to one control: the label names it, the description and error are read with it, and an error marks it `aria-invalid`. `Slider` connects to an enclosing `Field` on its own, so it needs no `label` there. For any other control, pass a function as the children and spread the `FieldControlProps` it receives. Restyle it with the `--hm-field-*` tokens.

- [#32](https://github.com/ie-huss-martinez/ui/pull/32) [`795a48f`](https://github.com/ie-huss-martinez/ui/commit/795a48f486415d938ec2ff695a589f3c1f771fc3) Thanks [@hussmartinez](https://github.com/hussmartinez)! - Add `FileDropZone`, where people choose or drop files. Its button opens the system's file picker and is the keyboard and screen reader path; the zone around it takes dropped files from a pointer, and has `data-hm-dragging` while files are over it, without flickering as they cross its children. `accept` and `multiple` are checked by name, type and count, and dropped folders are turned away: `onFiles` receives the files that pass, and `onFilesRejected` the others, each with a reason. The zone never reads a file or shows its name, so validate contents yourself. While a zone is on the page, a file dropped beside it no longer opens in place of the page. The text comes from the new `fileDropZone.*` messages, and the look from the `--hm-file-drop-zone-*` tokens.

- [#31](https://github.com/ie-huss-martinez/ui/pull/31) [`a4704e2`](https://github.com/ie-huss-martinez/ui/commit/a4704e21a9aaaf1fbb10e126a7e1badd65115b60) Thanks [@hussmartinez](https://github.com/hussmartinez)! - Add `NumberField`, a number typed as text and exposed as a spin button. Typing is committed on blur or Enter and kept within `min` and `max`; text that isn't a number goes back to the last value, so `onValueChange` never receives `NaN`. Arrow Up and Arrow Down move by `step`, Page Up and Page Down by `largeStep`, and Escape throws the typing away. `parse` and `format` default to the `locale`, or `UiMessagesProvider`'s, including its digits and separators; replace them for units or a timecode. With `name`, forms receive the number rather than the formatted text. It connects to an enclosing `Field`, and takes the `--hm-number-field-*` tokens.
  
  Inside a `Field`, `Slider` and `NumberField` now warn in development when they also get a `label` or `aria-label`, which would replace the field's visible label for screen readers.

- [#27](https://github.com/ie-huss-martinez/ui/pull/27) [`ff596a1`](https://github.com/ie-huss-martinez/ui/commit/ff596a116e070ba4155e93fbbb08a3e65a592ad1) Thanks [@hussmartinez](https://github.com/hussmartinez)! - Add `Slider`, for a value in a range such as volume or zoom, on the native `<input type="range">`. Control it with `value` and `onValueChange`, or let it keep its own value from `defaultValue`; `min`, `max`, `step` and `largeStep` set the range and steps. `formatValue` gives screen readers the value as text, such as "−6 dB". The arrow keys, Page Up and Page Down, Home and End work the same in every browser, and the slider is mirrored in right-to-left text. Restyle it with the `--hm-slider-*` tokens.

- [#25](https://github.com/ie-huss-martinez/ui/pull/25) [`f38df72`](https://github.com/ie-huss-martinez/ui/commit/f38df723494e061c0eec9230b15bb995d27b930e) Thanks [@hussmartinez](https://github.com/hussmartinez)! - Add `ToggleButton`, a button that turns something on or off, such as loop playback or the active tool, exposed as `aria-pressed`. Control it with `pressed` and `onPressedChange`, or let it keep its own state from `defaultPressed`. It takes text children, or an `icon` with a required `label`, and works as an item inside `Toolbar`.
  
  Toggle buttons that are on, including `Button` and `IconButton` with `pressed`, now have an accent border as well as a fill, so the state no longer rests on colour alone (WCAG 1.4.11). Change it with the new `--hm-button-pressed-border-color` token.

## 0.1.1

### Patch Changes

- [#22](https://github.com/ie-huss-martinez/ui/pull/22) [`a29a6c6`](https://github.com/ie-huss-martinez/ui/commit/a29a6c6ade511d50129649050aa7630ff7380bfa) Thanks [@hussmartinez](https://github.com/hussmartinez)! - The README now shows how to install the package, which peer dependencies the React components need, and a quick start with the stylesheet, `ThemeProvider` and a `Button`. It no longer says the package isn't published.

## 0.1.0

### Minor Changes

- [#20](https://github.com/ie-huss-martinez/ui/pull/20) [`f0c6ad3`](https://github.com/ie-huss-martinez/ui/commit/f0c6ad30c0ec7a4a571ab4ef96219da17ce55e17) Thanks [@hussmartinez](https://github.com/hussmartinez)! - First release of `@hussmartinez/ui`, the design system of the `@hussmartinez` SDK family: design tokens, themes, base styles and accessible React components. It's ESM only, with three entry points: `@hussmartinez/ui` (server-safe), `@hussmartinez/ui/react` and `@hussmartinez/ui/styles.css`.
  
  - **Tokens:** base, semantic and component tokens as `--hm-*` custom properties. The built-in light and dark themes meet WCAG 2.2 AA contrast and follow the system preference in pure CSS. `data-hm-theme` and `data-hm-density` change any subtree.
  - **Custom themes:** `createTheme` validates every value against an allowlist, so values from users can't inject CSS, and warns in development about contrast below AA; `checkContrast` returns the same report. Apply themes with `ThemeProvider`, which renders on the server, or as a static stylesheet with `themeToCss`, for strict Content Security Policies. Invalid themes throw `UiError` with `INVALID_THEME_TOKEN` or `INVALID_THEME_SELECTOR`.
  - **Components:** `Button`, `IconButton`, `Toolbar` with `ToolbarGroup` and `ToolbarSeparator`, `SegmentedControl`, `Dialog`, `Spinner`, `ProgressBar`, `VisuallyHidden`, and `AnnouncerProvider` with `useAnnounce`. Each takes `className`, `classNames` per part and `unstyled`, forwards its ref, renders on the server, and works with the keyboard and screen readers.
  - **Text:** components take text props, falling back to `UiMessagesProvider`, which accepts your sdk-core message catalogue; `uiMessages` has the English text.
