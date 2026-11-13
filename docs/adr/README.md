# Architecture decision records

Decisions specific to `@hussmartinez/ui`. Decisions for the whole SDK family live in [`sdk-core`'s `docs/adr`](https://github.com/ie-huss-martinez/sdk-core/tree/main/docs/adr); the records here build on them and never contradict them. To change a family decision, write a record in `sdk-core`.

Each record captures one significant decision: the context that forced it, what we chose, the alternatives we rejected and the consequences we accept. Records are numbered and immutable. To change a decision, write a new record that supersedes the old one and link the two.

Use [`template.md`](template.md) for new records. Name files `NNNN-short-title.md`, taking the next free number.

| # | Decision | Status |
|---|---|---|
| [0001](0001-design-tokens-and-theme-scoping.md) | Design tokens, theme layers and theme scoping | Accepted |
| [0002](0002-visual-regression-in-a-pinned-container.md) | Visual regression in a pinned container | Accepted; image location superseded by [0004](0004-one-browser-test-image.md) |
| [0003](0003-component-contract.md) | The component contract | Accepted; "`ui` ships no icon set" superseded by [0005](0005-icon-set.md) |
| [0004](0004-one-browser-test-image.md) | One browser test image, in one place | Accepted |
| [0005](0005-icon-set.md) | An icon set generated from Lucide | Accepted |
| [0006](0006-overlays-in-the-top-layer.md) | Overlays in the top layer, placed without a library | Accepted |
