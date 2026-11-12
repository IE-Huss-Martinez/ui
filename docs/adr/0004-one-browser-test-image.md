# 0004. One browser test image, in one place

- **Status:** Accepted
- **Date:** 2026-11-12

## Context

[ADR 0002](0002-visual-regression-in-a-pinned-container.md) runs the visual tests in Microsoft's Playwright image, pinned by tag and digest in `apps/catalogue/visual/Dockerfile`. CI's `verify` job later moved into the same image, so its browsers and system libraries come preinstalled instead of through a slow and fragile `apt` step. That gave the image two copies, the Dockerfile and the workflow's `container.image`, kept equal by a unit test.

The first Dependabot update showed the cost. Dependabot updates the Dockerfile but not a workflow's `container.image`, so its pull request failed until someone edited the workflow by hand. Its title, `test: bump playwright from 6e3fb70 to 9beb546 in /apps/catalogue/visual`, was also over the 65-character limit of the `pr-title` check, because Dependabot always appends `in /<directory>`, and no `commit-message` option removes it.

## Decision

- **One place:** `ci/Dockerfile` defines the browser test image. The visual tests build it, and CI's `verify` job runs in its base image.
- **The workflow reads it:** a small `image` job reads the Dockerfile's `FROM` line, requires exactly one, and checks it against `mcr.microsoft.com/playwright:v<version>-noble@sha256:<digest>` before outputting it. `verify` uses that output as its container image. A workflow can't read a file for `container.image` directly, which is why the job exists.
- **A failure can't pass silently:** a job whose dependency failed is skipped, and a skipped required check counts as passing. So `verify` runs unless the run was cancelled, and falls back to an image name that can't be pulled, which fails it.
- **Short Dependabot titles:** the Dockerfile sits in a short top-level directory, `ci/`, and its Dependabot entry uses the prefix `ci`. Titles such as `ci: bump playwright from v1.65.0-noble to v1.66.0-noble in /ci` stay within the limit.
- **Tests keep the rest in step:** the image's Playwright version must equal the installed package's, it must be pinned by digest, its pnpm must equal `packageManager`, and the workflow must take its image from the `image` job, with no copy of its own.

ADR 0002's location for the image, `apps/catalogue/visual/Dockerfile`, is superseded; the rest of ADR 0002 stands.

## Alternatives considered

- **Two copies kept equal by a test:** every Dependabot update fails until someone edits the workflow. The test catches the drift, but someone still has to fix it by hand.
- **Running the browser tests in Docker from a plain runner,** as `pnpm test:visual` does locally: one copy, but every CI run would build the image and run the whole suite inside `docker run`, which is slower and harder to read than a job container.
- **Leaving the Dockerfile where it was and retitling Dependabot's pull requests by hand:** a recurring chore, for a check that should pass on its own.

## Consequences

- One Dependabot pull request updates CI and the visual tests together, and passes on its own when the new image renders the same.
- The workflow has a second, tiny job, which adds a few seconds before `verify` starts.
- `ci/` describes the image's role: it's the browser environment of all of CI, not only of the catalogue's visual tests.
