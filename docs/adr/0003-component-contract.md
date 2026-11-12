# 0003. The component contract

- **Status:** Accepted
- **Date:** 2026-11-10

## Context

`ui`'s components are used inside every SDK's editor and directly by applications ([ADR 0002 in sdk-core](https://github.com/IE-Huss-Martinez/sdk-core/blob/main/docs/adr/0002-one-repository-per-sdk.md)). `STANDARDS.md` lists what every component accepts (`className`, `classNames`, `unstyled`, refs, translatable text), and ADRs 0003, 0005, 0006, 0007 and 0014 constrain naming, styling, theming, server rendering and accessibility. They don't say how those are implemented, and every component should implement them the same way.

## Decision

- **Classes:** the root is `.hm-<component>`, variants are `.hm-<component>--<variant>`, and parts are `.hm-<component>-<part>`, such as `.hm-button-icon`. `className` goes on the root; `classNames` has one entry per named part, and its keys are part of the component's API.
- **State:** ARIA attributes first (`aria-pressed`, `aria-checked`, `aria-disabled`, `aria-busy`), then `data-hm-*`. No state classes.
- **`unstyled`** sets `data-hm-unstyled` on the root. Visual rules (colours, borders, typography, motion) are written as `.hm-<component>:not([data-hm-unstyled])`; layout, focus indication and target sizes are not, so an unstyled component stays usable and accessible.
- **Component tokens** are listed in the token source with their semantic fallback, and read as `var(--hm-<token>, var(--hm-<fallback>))`, never declared ([ADR 0001](0001-design-tokens-and-theme-scoping.md)). Component CSS uses no base tokens. A test checks both, and that every component's CSS is imported by `styles.css`.
- **Text:** no inline text. Components take explicit text props, which fall back to `UiMessagesProvider`: an sdk-core `Messages` object whose catalogue includes `uiMessages`, so SDKs pass their catalogue once. Without a provider, text is English. Accessible names that only the host can know, such as an `IconButton`'s `label`, are required props.
- **Icons:** slots of type `ReactNode` that draw with `currentColor`. `ui` ships no icon set; where a component needs an icon of its own, such as a dialog's close button, it ships one inline SVG that a prop replaces.
- **React:** `forwardRef` to the root element, native props passed through, IDs from `useId`, nothing read from the browser during render, and no React 19-only APIs ([ADR 0013](https://github.com/IE-Huss-Martinez/sdk-core/blob/main/docs/adr/0013-browser-and-react-support.md)).
- **Applications ship only what they use:** module-scope calls such as `forwardRef(…)` and `createContext(…)` are annotated `/* @__PURE__ */`, so a bundler drops unused components. A test bundles single components from the built package and checks.
- **Files:** `src/components/<name>/` holds `<Name>.tsx`, `<name>.css`, unit tests (`*.test.tsx`) and browser tests (`*.browser.test.tsx`). Stories live in `apps/catalogue/src/components/`, and cover every state; each runs with axe on three engines, and in three themes and two densities in the visual tests ([ADR 0002](0002-visual-regression-in-a-pinned-container.md)).

## Alternatives considered

- **`unstyled` dropping every class:** hosts would lose the stable `.hm-*` hooks they style against, and the layout and target sizes too.
- **Text props only, every one required:** verbose in every SDK, and translation would mean passing the same strings to every instance.
- **A context-only text lookup:** hosts couldn't override one instance's text.
- **An icon library dependency:** adds weight and a visual style hosts may not want; slots cost nothing.

## Consequences

- Every component is styled, overridden, translated and tested the same way, so SDKs and hosts learn one contract.
- Writing visual rules with `:not([data-hm-unstyled])` makes selectors a little longer.
- A new component needs stories and baselines in every theme and density before it's merged.
