---
"@hussmartinez/ui": minor
---

Add `ToggleButton`, a button that turns something on or off, such as loop playback or the active tool, exposed as `aria-pressed`. Control it with `pressed` and `onPressedChange`, or let it keep its own state from `defaultPressed`. It takes text children, or an `icon` with a required `label`, and works as an item inside `Toolbar`.

Toggle buttons that are on, including `Button` and `IconButton` with `pressed`, now have an accent border as well as a fill, so the state no longer rests on colour alone (WCAG 1.4.11). Change it with the new `--hm-button-pressed-border-color` token.
