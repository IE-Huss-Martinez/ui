---
"@hussmartinez/ui": minor
---

Add `FileDropZone`, where people choose or drop files. Its button opens the system's file picker and is the keyboard and screen reader path; the zone around it takes dropped files from a pointer, and has `data-hm-dragging` while files are over it, without flickering as they cross its children. `accept` and `multiple` are checked by name, type and count, and dropped folders are turned away: `onFiles` receives the files that pass, and `onFilesRejected` the others, each with a reason. The zone never reads a file or shows its name, so validate contents yourself. While a zone is on the page, a file dropped beside it no longer opens in place of the page. The text comes from the new `fileDropZone.*` messages, and the look from the `--hm-file-drop-zone-*` tokens.
