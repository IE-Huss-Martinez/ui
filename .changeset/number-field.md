---
"@hussmartinez/ui": minor
---

Add `NumberField`, a number typed as text and exposed as a spin button. Typing is committed on blur or Enter and kept within `min` and `max`; text that isn't a number goes back to the last value, so `onValueChange` never receives `NaN`. Arrow Up and Arrow Down move by `step`, Page Up and Page Down by `largeStep`, and Escape throws the typing away. `parse` and `format` default to the `locale`, or `UiMessagesProvider`'s, including its digits and separators; replace them for units or a timecode. With `name`, forms receive the number rather than the formatted text. It connects to an enclosing `Field`, and takes the `--hm-number-field-*` tokens.

Inside a `Field`, `Slider` and `NumberField` now warn in development when they also get a `label` or `aria-label`, which would replace the field's visible label for screen readers.
