---
"@hussmartinez/ui": minor
---

Add `usePlatform()`, which returns `"apple"` on macOS, iOS and iPadOS, where `Mod` is ⌘, and `"other"` elsewhere, for shortcut labels and sdk-core's `createShortcutRegistry({ platform })`. It returns `"other"` on the server and during hydration, then switches on Apple devices in the next render, so server-rendered pages hydrate without a mismatch. Use it instead of reading `navigator` during render.
