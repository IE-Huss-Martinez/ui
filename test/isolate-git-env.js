// Vitest setup file, as in sdk-core: removes every GIT_* variable from the
// test process's environment before any test runs.
//
// Git sets variables such as GIT_DIR when it runs a hook. From a linked
// worktree, GIT_DIR is absolute, so a test that runs git in its own temporary
// repository, as the Changesets configuration test does, would act on the
// repository being pushed instead. Child processes inherit this cleaned
// environment.
for (const name of Object.keys(process.env)) {
  if (name.startsWith("GIT_")) {
    delete process.env[name];
  }
}
