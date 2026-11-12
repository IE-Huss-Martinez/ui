import { defineConfig } from "vitest/config";

// Tests of the repository's own tooling: the release scripts, the Changesets
// configuration and the CI image. Each package and app has its own Vitest
// config for its tests.
export default defineConfig({
  test: {
    include: ["test/**/*.test.js"],
    // These tests run git in temporary repositories, possibly from inside a
    // git hook.
    setupFiles: ["test/isolate-git-env.js"],
  },
});
