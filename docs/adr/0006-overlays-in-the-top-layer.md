# 0006. Overlays in the top layer, placed without a library

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

`Tooltip` is ui's first overlay that floats next to another element; `Popover` and `Menu` will follow. Such an overlay has to:

- **Appear above everything,** whatever stacking contexts, `overflow: hidden` or `transform` its trigger sits inside. SDK editors are full of scrolling panes and toolbars.
- **Sit next to its trigger,** on the side with room, and inside the viewport.
- **Fit the family's rules:** nothing in render that depends on the browser ([sdk-core ADR 0007](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0007-server-rendering-and-nextjs.md)), no inline style attributes that a strict Content Security Policy would block, and a small, justified dependency footprint with a size budget for the React entry.

The usual answers are a portal into `document.body` with a `z-index`, and a positioning library such as Floating UI.

## Decision

- **The top layer, through the Popover API.** An overlay is rendered next to its trigger as `popover="manual"`, and shown with `showPopover()`. The top layer sits above every stacking context, so there's no portal, no `z-index` token and no `overflow` clipping. The element is in the server-rendered markup, hidden until shown, so `aria-labelledby` and `aria-describedby` can point at it from the first render. Every engine in [sdk-core ADR 0013](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0013-browser-and-react-support.md)'s range has the Popover API.
- **A small placement function, no library.** When the overlay opens, it measures the trigger and itself:
  - it takes the preferred side, or the other side when the preferred one lacks room and the other has it;
  - it centres on the trigger, kept inside the viewport.
  - It sets `top` and `left` through the CSSOM, which a strict Content Security Policy allows, unlike `style` attributes in markup. The gap to the trigger is a CSS `translate` from a token, so no length is hard-coded in JavaScript.
- **It's placed once, when it opens.** Scrolling or resizing closes a tooltip, which is short-lived anyway. A tooltip doesn't follow its trigger through other layout changes while open.

## Alternatives considered

- **Floating UI:** it's thorough (collision detection, arrows, auto-update), but it's a runtime dependency for every application, adding several kilobytes to the React entry's budget, for placement a tooltip needs in a few lines.
- **A portal and `z-index`:** it needs a stacking scale, a container for portals, and care with server rendering. It can still lose to a host's own stacking contexts, which the top layer can't.
- **CSS anchor positioning:** it would make placement declarative, with no measurement in JavaScript. When every engine in sdk-core ADR 0013's range supports it, a new record can move placement into CSS.

## Consequences

- Overlays need no stacking tokens or portal containers, and they work inside dialogs, which are in the top layer too.
- `Popover` and `Menu` reuse the same approach. They stay open longer than a tooltip, so they may need to follow their trigger while open, through scroll listeners or a `ResizeObserver`. Their pull requests decide that, and amend this record if the placement function changes.
- The placement function is ui's own code, covered by the components' browser tests on the three engines: above, below when there's no room, and inside the viewport.
