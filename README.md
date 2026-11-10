# ui

The design system of the `@hussmartinez` SDK family: design tokens, themes, base styles and accessible React components. It's used by every SDK's editor and by standalone applications. Everything is fully themable, server-rendering safe and namespaced with `hm-`.

This repository will publish **`@hussmartinez/ui`**. It follows the family standards in [`sdk-core`'s `STANDARDS.md`](https://github.com/hussmartinez/sdk-core/blob/main/STANDARDS.md), and in particular the decisions on [styling](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0005-plain-css-with-cascade-layers.md), [theming](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0006-design-tokens-and-theming.md) and [accessibility](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0014-accessibility-and-translatable-text.md).

> Status: being bootstrapped. No packages are published yet.

## Development

This repository is a pnpm workspace. The published package lives in [`packages/ui`](packages/ui); applications that aren't published, such as the component catalogue, will live in `apps/`.

You need Node 24 (see [`.node-version`](.node-version)) and pnpm. The exact pnpm version is pinned in `package.json`, and pnpm switches to it automatically.

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
| Browser tests | `test:browser` | Vitest in Chromium, and in Firefox and WebKit too in CI |
| Size budgets | `check:size` | size-limit, brotli size of each entry point |
| API reports | `check:api` | api-extractor, one report per entry point in `packages/ui/api` |
| Package checks | `check:package` | publint and Are the Types Wrong? |

The configuration extends the shared presets in [`@hussmartinez/sdk-config`](https://www.npmjs.com/package/@hussmartinez/sdk-config). The git hooks ([ADR 0016](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0016-git-hooks-and-merge-guards.md)) run automatically: a secret scan and lint of staged files on commit, a Conventional Commits check of the message, and `pnpm verify:fast` on push.

When a change alters the public API on purpose, update the reports with `pnpm --filter @hussmartinez/ui api:update` and commit them.

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request. Coding agents also start with [`AGENTS.md`](AGENTS.md). Everyone taking part follows the [code of conduct](CODE_OF_CONDUCT.md). Report vulnerabilities privately, as described in the [security policy](SECURITY.md).

## License

[Apache-2.0](LICENSE)
