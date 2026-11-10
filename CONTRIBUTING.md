# Contributing

Thank you for helping. This repository is the design system of the `@hussmartinez` SDK family, so changes here reach every SDK's editor and every application that uses it. That's why the process below is a little more formal than usual.

By taking part, you agree to follow the [code of conduct](CODE_OF_CONDUCT.md). To report a vulnerability, follow the [security policy](SECURITY.md) instead of opening an issue.

## Before you start

- **Open an issue first** for anything bigger than a small fix, so we can agree on the approach before you spend time on it. New components and changes to tokens or theming are public API, so they always start with an issue.
- **Read [`STANDARDS.md`](https://github.com/hussmartinez/sdk-core/blob/main/STANDARDS.md)** in `sdk-core`. It's binding for every repository in the family. The reasoning behind each rule is in the [family's architecture decision records](https://github.com/hussmartinez/sdk-core/tree/main/docs/adr), and decisions specific to this repository go in `docs/adr`.
- **Coding agents** also start with [`AGENTS.md`](AGENTS.md).

## Set up

You need Node 24 (see [`.node-version`](.node-version)) and pnpm. pnpm switches to the version pinned in `package.json` automatically.

```sh
pnpm install       # also installs the git hooks
pnpm verify        # everything CI runs
pnpm verify:fast   # the subset the pre-push hook runs
```

Browser tests need Playwright's browsers once: `pnpm --filter @hussmartinez/ui exec playwright install chromium firefox webkit`.

**Visual tests need [Docker](https://docs.docker.com/get-docker/).** `pnpm verify` runs them inside a pinned Playwright image, so screenshots match on every machine ([ADR 0002](docs/adr/0002-visual-regression-in-a-pinned-container.md)). The first run downloads the image, about 2 GB. Without Docker, `pnpm verify` stops at `test:visual` and says how to fix it.

```sh
pnpm test:visual          # compare every story with its baselines
pnpm test:visual:update   # write new baselines after an intended visual change
```

Commit updated baselines with the change that caused them, and look at the image diffs in the pull request before asking for review.

The git hooks run on their own: a secret scan and lint of staged files on commit, a Conventional Commits check of each message, and `pnpm verify:fast` on push. Don't bypass them with `--no-verify`. If a hook is wrong or too slow, fix it in its own pull request.

## Make a change

- **One focused change per pull request,** on a branch from an up-to-date `main`. Small pull requests get reviewed quickly; large ones get split.
- **Commits** follow [Conventional Commits](https://www.conventionalcommits.org/), with a lowercase subject and a header of at most 72 characters:
  - **types:** `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore` and `revert`;
  - **scopes** are optional; this repository publishes one package;
  - **`feat`** for any new public capability, such as a component, a prop or a token;
  - **breaking changes** take a `!`, as in `feat!: …`, and explain the migration in the body.
- **Signed commits** are preferred.
- **Tests:** unit tests sit next to the code as `*.test.ts`, and browser tests as `*.browser.test.ts`. Test behaviour, not lines of code. Components are tested with the keyboard and with axe.
- **Catalogue:** every component has stories in [`apps/catalogue`](apps/catalogue), covering its states. Each story is a test: it runs on three engines with axe, and visual tests render it in every theme and density.
- **Public API:** fully typed, with TSDoc on every export. If a change alters the API on purpose, update the reports with `pnpm --filter @hussmartinez/ui api:update` and commit them.
- **Styles:** plain CSS in the `hm.*` cascade layers, with `hm-` names and values from `--hm-*` tokens. stylelint enforces this. A disable comment needs a description that says why.
- **Tokens:** edit the source in `packages/ui/src/tokens`, then run `pnpm --filter @hussmartinez/ui tokens` to regenerate `tokens.css` and the token reference. A test fails if they're stale. New semantic tokens and changes to the built-in colours must keep every contrast pair at WCAG 2.2 AA, which the tests check. See [ADR 0001](docs/adr/0001-design-tokens-and-theme-scoping.md).
- **Accessibility:** WCAG 2.2 AA, with full keyboard support and visible focus. Visible text and accessible names are never hard-coded.
- **Dependencies:** add one only when it's clearly worth it, and justify it in the pull request.
- **Docs:** keep the READMEs accurate.
- **Decisions:** anything that affects public API, consistency across the family or security, or that is hard to reverse, gets an ADR in `docs/adr` in the same pull request. To change a decision, add a new ADR that supersedes the old one. A change to a family-wide decision belongs in `sdk-core`.

## Open a pull request

- **Title:** a Conventional Commit of at most 65 characters, because it becomes the commit title on `main`, followed by ` (#NNN)`, and that must fit in 72. Put explanations in the description. The `pr-title` check enforces both.
- **Description:** fill in the template: what changed, why, and how you tested it, including the result of `pnpm verify`. Be as detailed as is useful; the description doesn't go into git history.
- **Changeset:** add one if the pull request changes what the package publishes. See [Changesets](#changesets).
- **Checks:** the required checks must pass, and the branch must be up to date with `main`.

Mark the pull request ready once `pnpm verify` passes locally. CI is the final gate, not a substitute for running it yourself.

## How pull requests are reviewed

**The author of a pull request never merges it.** A separate reviewer does, after reviewing it:

- **The diff:** the reviewer reads the full diff and checks it against `STANDARDS.md` and the ADRs.
- **The checks:** CI must be green. For any change to code, the reviewer also runs `pnpm verify` independently, rather than relying on the author's result.
- **Not "almost right":** if the scope, title or quality isn't right, the pull request is fixed before it's merged.

**Coding agents** open one pull request at a time. After opening it, they stop and report the link, a short summary and their `pnpm verify` result. They start the next change only after the pull request is merged, from an up-to-date `main`. An agent never reviews or merges a pull request it wrote; author and reviewer are always different sessions.

## How pull requests are merged

Pull requests are squash-merged into a linear `main`, and the reviewer writes the squash commit message:

- **Title:** the pull request title, followed by the pull request number, such as `feat: add the Button component (#12)`.
- **Body:** 2–6 lines of plain prose, wrapped at 72 characters, saying what changed and why.
- **Never in the body:** Markdown headings, checklists or test logs. Those belong in the pull request description.

For example:

```text
feat: add the Button component (#12)

Adds Button with primary, secondary and quiet variants, in two sizes.
It forwards its ref, takes className, classNames and unstyled like
every component, and draws its icon slot with currentColor, so it
follows any theme without extra CSS.
```

## Changesets

Versions and release notes come from changesets ([ADR 0021](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0021-version-and-release-with-changesets.md)), not from commit messages. A changeset is a small Markdown file in `.changeset/` that names the version bump a pull request needs and a note for the people who use the package.

```sh
pnpm changeset
```

It asks how the package changed, then writes the file. Commit it with your change.

- **When you need one:** whenever a pull request changes the package's published source or its `package.json`, meaning `packages/ui/src/` outside tests and fixtures.
- **When you don't:** for tests, fixtures, the catalogue, READMEs, documentation, CI and root tooling. If a change touches published files without affecting users, such as a pure refactor, add an empty changeset with `pnpm changeset --empty`.
- **The bump:**
  - `patch` for fixes;
  - `minor` for new capabilities, and during `0.x` for breaking changes too;
  - `major` only after `1.0`, for breaking changes.

**Write the note for users, not reviewers.** It becomes the package's changelog entry and its GitHub Release notes.

- **Say what changed for them, and what to do:** "`Dialog` now returns focus to the element that opened it" rather than "refactor the focus handling".
- **Name the API they'll see:** component, prop, token or CSS class. Describe the behaviour, not the implementation.
- **Explain the migration** for anything breaking: what to change in their code, with a short example.
- **Keep it short.** One or two sentences is typical, with a list for several related changes. The pull request holds the detail.

## Licence

By contributing, you agree that your contributions are licensed under the [Apache License 2.0](LICENSE), like the rest of the project.
