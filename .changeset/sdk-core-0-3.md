---
"@hussmartinez/ui": patch
---

ui now requires `@hussmartinez/sdk-core` 0.3.0 or a later 0.3 release. Earlier ui versions accepted sdk-core 0.1, which resolves to 0.1.3: that version, like 0.2.0, was published without its built files, so importing it failed. If your application depends on sdk-core directly, upgrade it to 0.3 too, so there's one copy.
