---
"@hussmartinez/ui": patch
---

Production bundles no longer carry ui's development-only code: the text of its warnings, the check for a second copy of ui, and `createTheme`'s contrast check with its colour maths. Each is now guarded inline by `process.env.NODE_ENV`, which bundlers replace and fold away. An application that calls `createTheme` ships about 1.5 kB less, compressed, and one using a few components about 0.4 to 0.5 kB less. Behaviour is unchanged: warnings still print in development and never in production, and `checkContrast` still works when you call it.
