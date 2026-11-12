# Changesets

Each file here describes one user-facing change to `@hussmartinez/ui`, and the version bump it needs. Add one with `pnpm changeset` in any pull request that changes the package's published source or `package.json`. See [CONTRIBUTING.md](../CONTRIBUTING.md#changesets) for how to write a good one.

When changesets reach `main`, the release workflow opens a "chore: version packages" pull request that applies them: it bumps the version, writes the changelog and deletes these files. Merging that pull request publishes the package ([ADR 0021](https://github.com/ie-huss-martinez/sdk-core/blob/main/docs/adr/0021-version-and-release-with-changesets.md)).
