---
"@hussmartinez/ui": minor
---

Add `Tooltip`, for short text about a control. It shows after a short delay on hover, and at once on keyboard focus, never on touch or a mouse click's focus. The pointer can move onto it, and Escape closes it without moving focus or closing a surrounding dialog (WCAG 1.4.13). Wrap one ref-forwarding trigger, such as `IconButton`:

- `type="label"` makes its text the trigger's name, for icon-only buttons; `description`, the default, describes the trigger.
- `shortcut` takes the parts sdk-core's shortcut registry gives (`registry.describe(toolId)[0]`). It shows them in the platform's notation, ⌘⇧Z or Ctrl+Shift+Z, through the `keys.*` messages, and sets `aria-keyshortcuts` on the trigger.

It renders in the top layer through the Popover API, above the trigger or below it when there's no room, with no positioning library. Restyle it with the `--hm-tooltip-*` tokens. A disabled trigger needs `focusableWhenDisabled`, because a natively disabled button gets no focus or pointer events.
