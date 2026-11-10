# Working in this repository

This repository is part of the `@hussmartinez` SDK family and is public. Treat it as a showcase: code, commits and pull requests should read as professional work.

It publishes `@hussmartinez/ui`, the family's design system: design tokens, themes, base styles and accessible React components. Every SDK's editor and standalone applications depend on it, so changes here reach all of them.

## Before changing anything

- Read [`STANDARDS.md`](https://github.com/hussmartinez/sdk-core/blob/main/STANDARDS.md) in `sdk-core`. It is binding for every repository in the family.
- Check the decision records before changing anything they cover. Family-wide decisions live in [`sdk-core`'s `docs/adr`](https://github.com/hussmartinez/sdk-core/tree/main/docs/adr); decisions specific to this repository live in `docs/adr` here. To change a decision, write a new ADR that supersedes the old one, in the same pull request as the change. A change to a family-wide decision belongs in `sdk-core`, not here.
- The records that matter most here are [0003](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0003-hm-namespace.md) (the `hm` namespace), [0004](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0004-entry-points-and-module-format.md) (entry points), [0005](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0005-plain-css-with-cascade-layers.md) (plain CSS with cascade layers), [0006](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0006-design-tokens-and-theming.md) (tokens and theming), [0007](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0007-server-rendering-and-nextjs.md) (server rendering), [0013](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0013-browser-and-react-support.md) (browsers and React) and [0014](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0014-accessibility-and-translatable-text.md) (accessibility and translatable text).

## Making changes

- **Pull requests:** work on a branch and open one focused pull request per change. Never push to `main`; it is protected.
- **Pull request descriptions:** cover what changed, why, and how it was tested. They can be as detailed as useful, because they don't go into git history.
- **Squash commits:** the merger writes the commit message on `main`. Its title is the pull request title plus `(#N)`, and its body is 2–6 lines of plain prose. See [How pull requests are merged](https://github.com/hussmartinez/sdk-core/blob/main/CONTRIBUTING.md#how-pull-requests-are-merged).
- **Commits:** follow Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `build:`, `ci:`, `chore:`). The pull request title becomes the squash commit, so write it as a Conventional Commit too.
- **Changesets:** a pull request that changes the published package's source or `package.json` adds a changeset with `pnpm changeset`. Write its note for the package's users: what changed for them, the API they'll see, and how to migrate if it breaks. Versions and changelogs come from changesets, not commits. See [Changesets](https://github.com/hussmartinez/sdk-core/blob/main/CONTRIBUTING.md#changesets).
- **Signing:** commits are signed; don't disable signing.
- **No attribution:** don't add AI or tool attribution to commits or pull requests.
- **ADRs:** add one for any significant decision, meaning anything affecting public API, cross-package consistency or security, or that is hard to reverse.
- **Other repositories:** don't edit them from here. If this repository needs a change elsewhere, such as a shared preset in `@hussmartinez/sdk-config`, propose it in that repository.

## Design system rules

These follow from the standards; they're repeated here because they apply to almost every change in this repository.

- **Namespace:** everything that reaches the page starts with `hm-`: classes are `.hm-<part>`, custom properties `--hm-*` and attributes `data-hm-*`. States use ARIA attributes, then `data-hm-*`, never generic state classes.
- **CSS:** plain CSS in the layers `hm.tokens`, `hm.base` and `hm.components`; `hm.sdk` is reserved for the SDKs. No global selectors, and no literal values: colours, lengths, durations, shadows, z-indexes and font values come from tokens. Library code never imports CSS.
- **Tokens:** three levels, base, semantic and component. Components use only semantic and component tokens. Built-in themes meet WCAG 2.2 AA contrast, and `createTheme` warns in development when a custom theme doesn't.
- **Components:** accept `className`, `classNames` per named part and `unstyled`, forward refs, and use icons that draw with `currentColor`. Visible text and accessible names are never hard-coded: hosts can override and translate them.
- **Server rendering:** the `.` entry is server-safe, with no React and no DOM access on import. React code runs on the server without errors and hydrates without warnings: no browser APIs during render, IDs from `useId`, and nothing in render that depends on time or randomness.

## Verifying changes

- **Hooks:** they run automatically: linting and a secret scan on commit, commit message checks, and `pnpm verify:fast` on push. Never use `--no-verify`. If a hook is wrong or too slow, fix it in its own pull request.
- **Before marking a pull request ready,** run the full `pnpm verify` locally and report its results in the description.
- **CI:** it runs `pnpm verify` on Chromium, Firefox and WebKit, and checks the pull request title. Both checks must pass before merging. CI is the final gate, not a substitute for local verification.
- **Never weaken a check to make it pass.** That includes lint rules, size budgets, the API report, accessibility and contrast checks, and visual baselines. Fix the cause, or propose the change in its own pull request with an ADR if the rule itself is wrong.
