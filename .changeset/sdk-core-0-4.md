---
"@hussmartinez/ui": minor
---

ui now requires `@hussmartinez/sdk-core` 0.4.1 or a later 0.4 release. In 0.x, ui's previous range, `^0.3.0`, allowed only 0.3 releases, so an application or SDK on sdk-core 0.4 installed two copies of sdk-core, and `instanceof SdkError` failed between them. Upgrade your own `@hussmartinez/sdk-core` to `^0.4.1` too, so `npm ls @hussmartinez/sdk-core` lists one version.
