---
"@hussmartinez/ui": minor
---

ui now warns in development when a second copy of it is in use on the page, naming the versions it found. Two copies don't share providers, so components from one copy miss the other's `UiMessagesProvider` and `AnnouncerProvider`: their text falls back to English, and announcements are lost. Make your application and your SDKs use the same minor version of ui; `npm ls @hussmartinez/ui` shows where each copy comes from. The check runs on first use, never on import, and is skipped in production. The README has a new "Using ui from an SDK" section.
