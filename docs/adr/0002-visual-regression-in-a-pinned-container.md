# 0002. Visual regression in a pinned container

- **Status:** Accepted
- **Date:** 2026-11-10

## Context

[ADR 0022](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0022-storybook-for-the-component-catalogue.md) chooses Storybook for the catalogue, and requires visual regression in all three themes and both densities ([ADR 0006](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0006-design-tokens-and-theming.md)). Screenshots depend on more than the code: fonts, font rendering, graphics libraries and browser builds differ between machines and operating systems. Baselines taken on one machine fail on another, so either every check needs the same environment, or the check can't be part of `pnpm verify` and reviewers can't run it.

## Decision

- **One environment.** Visual tests run only inside the official Playwright image, pinned by tag and digest in `apps/catalogue/visual/Dockerfile`, locally and in CI. `pnpm test:visual` builds the image, runs the tests in it, and is a step of `pnpm verify`. `pnpm test:visual:update` writes new baselines the same way.
- **Docker is a prerequisite** for `pnpm verify`. Without it, `test:visual` fails with a one-line message saying how to fix it; it never skips. The visual Vitest project refuses to run outside the image, so baselines can't be created anywhere else.
- **Chromium only.** Visual tests catch values that don't follow the tokens, which is independent of the engine. Story tests and axe still run on Chromium, Firefox and WebKit. Three engines would triple the baselines for little extra signal.
- **Every story in light, dark and Poster, in both densities,** compared pixel for pixel. Each render is also checked with axe, so contrast holds in every theme, not just the default one. A guard test fails if the a11y add-on stops failing stories with violations.
- **The image moves with Playwright.** A unit test fails when the image's Playwright version differs from the installed package, or when the image isn't pinned by digest. Dependabot proposes image updates, with the same seven-day cooldown as everything else.
- **Isolation.** The container gets its own `node_modules` and pnpm store volumes, so host binaries never mix with the container's, and the files it writes are handed back to the calling user.

## Alternatives considered

- **Visual tests in CI only, with Docker for updating baselines:** reviewers' local `pnpm verify` would skip them, so a review could pass while CI fails.
- **Baselines per operating system:** many more images to review, and a change still can't be checked on an operating system nobody on the change uses.
- **A hosted visual testing service:** sends screenshots to a third party, costs money, and needs secrets in pull request workflows.
- **Bundling fonts to stabilise rendering:** fixes font choice but not rasterisation, which differs between operating systems and graphics stacks.

## Consequences

- Visual changes are reviewed as image diffs in pull requests, and every machine agrees on them.
- Contributors need Docker. The first run downloads the image, about 2 GB.
- The image uses its own Node version (26 in Playwright 1.65), which satisfies `engines`; only the browser renders the screenshots.
- Updating Playwright means updating the image's tag and digest in the same pull request.
