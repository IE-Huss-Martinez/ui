---
"@hussmartinez/ui": minor
---

First release of `@hussmartinez/ui`, the design system of the `@hussmartinez` SDK family: design tokens, themes, base styles and accessible React components. It's ESM only, with three entry points: `@hussmartinez/ui` (server-safe), `@hussmartinez/ui/react` and `@hussmartinez/ui/styles.css`.

- **Tokens:** base, semantic and component tokens as `--hm-*` custom properties. The built-in light and dark themes meet WCAG 2.2 AA contrast and follow the system preference in pure CSS. `data-hm-theme` and `data-hm-density` change any subtree.
- **Custom themes:** `createTheme` validates every value against an allowlist, so values from users can't inject CSS, and warns in development about contrast below AA; `checkContrast` returns the same report. Apply themes with `ThemeProvider`, which renders on the server, or as a static stylesheet with `themeToCss`, for strict Content Security Policies. Invalid themes throw `UiError` with `INVALID_THEME_TOKEN` or `INVALID_THEME_SELECTOR`.
- **Components:** `Button`, `IconButton`, `Toolbar` with `ToolbarGroup` and `ToolbarSeparator`, `SegmentedControl`, `Dialog`, `Spinner`, `ProgressBar`, `VisuallyHidden`, and `AnnouncerProvider` with `useAnnounce`. Each takes `className`, `classNames` per part and `unstyled`, forwards its ref, renders on the server, and works with the keyboard and screen readers.
- **Text:** components take text props, falling back to `UiMessagesProvider`, which accepts your sdk-core message catalogue; `uiMessages` has the English text.
