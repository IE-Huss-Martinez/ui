---
"@hussmartinez/ui": minor
---

Add ui's icon set: 37 icons generated from Lucide, each a component named after its use in the SDK family, such as `UndoIcon`, `RotateLeftIcon`, `PlayIcon`, `LoopIcon` and `PageGridIcon`. Icons draw with `currentColor`, size to `--hm-icon-size` or to a button's icon slot, are decorative unless given a `label`, and mirror in right-to-left text when they point along the reading direction. Each is its own export, so applications ship only the icons they import. The `IconName` type, exported from both entries, names them for tools; map the names you use to components with `Partial<Record<IconName, IconComponent>>`. Lucide's licences are in the package's `THIRD_PARTY_NOTICES.md`.
