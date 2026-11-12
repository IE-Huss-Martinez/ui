---
"@hussmartinez/ui": minor
---

`FileDropZone` takes `preventStrayDrops`. It defaults to `true`, which keeps today's behaviour: while the zone is mounted, files dropped elsewhere on the page are turned away rather than opened in place of the page. Set it to `false` when your application handles stray drops itself, or embeds the zone in a page whose drag and drop it doesn't own; the zone then adds no listeners to `window`.
