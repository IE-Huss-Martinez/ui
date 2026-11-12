---
"@hussmartinez/ui": minor
---

Add `Field`, which wires a visible `label`, an optional `description` and an optional `error` to one control: the label names it, the description and error are read with it, and an error marks it `aria-invalid`. `Slider` connects to an enclosing `Field` on its own, so it needs no `label` there. For any other control, pass a function as the children and spread the `FieldControlProps` it receives. Restyle it with the `--hm-field-*` tokens.
