# The only environment visual regression tests run in, locally and in CI, so
# screenshots match pixel for pixel whatever machine runs them. The Playwright
# version in the tag must equal the one the workspace installs; a unit test in
# apps/catalogue checks it. Dependabot proposes updates to the pinned digest.
FROM mcr.microsoft.com/playwright:v1.65.0-noble@sha256:9beb546099e11f52d62e505537914870e01a67e0e6b00ae41da4775324e73dbe

# The pnpm version in the root package.json's packageManager field.
RUN npm install --global --ignore-scripts pnpm@12.18.0

ENV HM_VISUAL_CONTAINER=1
