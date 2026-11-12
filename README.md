# ui

The design system of the `@hussmartinez` SDK family: design tokens, themes, base styles and accessible React components. It's used by every SDK's editor and by standalone applications. Everything is fully themable, server-rendering safe and namespaced with `hm-`.

This repository will publish **`@hussmartinez/ui`**. It follows the family standards in [`sdk-core`'s `STANDARDS.md`](https://github.com/ie-huss-martinez/sdk-core/blob/main/STANDARDS.md), and in particular the decisions on [styling](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0005-plain-css-with-cascade-layers.md), [theming](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0006-design-tokens-and-theming.md) and [accessibility](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0014-accessibility-and-translatable-text.md).

> Status: `0.x`. [`@hussmartinez/ui`](https://www.npmjs.com/package/@hussmartinez/ui) is published, and its API may still change between minor versions.

## Development

This repository is a pnpm workspace. The published package lives in [`packages/ui`](packages/ui), the component catalogue, built with Storybook, in [`apps/catalogue`](apps/catalogue), and two example applications that use the built package as hosts do in [`examples`](examples), tested from [`e2e`](e2e). `pnpm --filter @hussmartinez/ui-catalogue dev` starts it.

You need Node 24 (see [`.node-version`](.node-version)), pnpm, and Docker for the visual tests. The exact pnpm version is pinned in `package.json`, and pnpm switches to it automatically.

```sh
pnpm install       # also installs the git hooks
pnpm verify        # everything CI runs
pnpm verify:fast   # the subset the pre-push hook runs
```

`pnpm verify` runs, in order:

| Step | Script | Tool |
|---|---|---|
| Format and lint | `lint` | Biome |
| CSS rules | `lint:css` | stylelint, with the `hm-` namespace and token rules |
| Types | `typecheck` | TypeScript |
| Dependency rules | `lint:deps` | dependency-cruiser, through `hm-lint-deps` |
| Build | `build` | Vite, then api-extractor for the type declarations |
| Unit tests | `test` | Vitest |
| Browser tests | `test:browser` | Vitest, and every catalogue story with axe, in Chromium, and in Firefox and WebKit too in CI |
| Visual tests | `test:visual` | Every story in three themes and two densities, in a pinned Playwright image (needs Docker) |
| End-to-end tests | `test:e2e` | Playwright against production builds of the [Next.js](examples/next) and [Vite](examples/vite) examples: server rendering, hydration without warnings, interaction, axe, and no requests to other origins |
| Size budgets | `check:size` | size-limit, brotli size of each entry point |
| API reports | `check:api` | api-extractor, one report per entry point in `packages/ui/api` |
| Package checks | `check:package` | publint and Are the Types Wrong? |

The configuration extends the shared presets in [`@hussmartinez/sdk-config`](https://www.npmjs.com/package/@hussmartinez/sdk-config). The git hooks ([ADR 0016](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0016-git-hooks-and-merge-guards.md)) run automatically: a secret scan and lint of staged files on commit, a Conventional Commits check of the message, and `pnpm verify:fast` on push.

When a change alters the public API on purpose, update the reports with `pnpm --filter @hussmartinez/ui api:update` and commit them.

Design tokens are defined once in [`packages/ui/src/tokens`](packages/ui/src/tokens). `pnpm --filter @hussmartinez/ui tokens` regenerates the CSS and the [token reference](packages/ui/docs/tokens.md) from them. Decisions specific to this repository are in [`docs/adr`](docs/adr).

## Releases

`@hussmartinez/ui` is versioned and released from changesets ([ADR 0021](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0021-version-and-release-with-changesets.md)). Versions stay at `0.x` until the API settles, and during `0.x` a breaking change bumps the minor version.

- **Changelog:** `packages/ui/CHANGELOG.md`, written for users. The first release creates it.
- **Release notes and files:** the [Releases page](https://github.com/ie-huss-martinez/ui/releases) has each version's notes, its npm tarball and a `SHA256SUMS` file, tagged like `@hussmartinez/ui@0.1.0`.
- **npm:** [`@hussmartinez/ui`](https://www.npmjs.com/package/@hussmartinez/ui), published from GitHub Actions with provenance.
- **Checking a download:** confirm that a tarball was built by this repository's release workflow:

  ```sh
  gh attestation verify hussmartinez-ui-0.1.0.tgz --repo ie-huss-martinez/ui
  sha256sum --check SHA256SUMS
  ```

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request. Coding agents also start with [`AGENTS.md`](AGENTS.md). Everyone taking part follows the [code of conduct](CODE_OF_CONDUCT.md). Report vulnerabilities privately, as described in the [security policy](SECURITY.md).

## License

[Apache-2.0](LICENSE)
