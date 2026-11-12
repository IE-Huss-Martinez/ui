/**
 * Runs the catalogue's visual regression tests inside the pinned Playwright
 * image (ci/Dockerfile), locally and in CI, so screenshots
 * match pixel for pixel on any machine.
 *
 *   node scripts/test-visual.mjs            compare with the baselines
 *   node scripts/test-visual.mjs --update   write new baselines
 *
 * Inside the pinned image itself, as in CI's verify job, it runs the tests
 * directly: a unit test keeps the workflow's image identical to the
 * Dockerfile's.
 *
 * The container gets its own node_modules volumes, so binaries installed for
 * the host never mix with the container's, and its own pnpm store volume, so
 * installs after the first are fast. Files it writes are handed back to the
 * calling user.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const update = process.argv.includes("--update");
const image = "hm-ui-visual";

const fail = (message) => {
  process.stderr.write(`test:visual: ${message}\n`);
  process.exit(1);
};

const vitestArgs = [
  "--filter",
  "@hussmartinez/ui-catalogue",
  "exec",
  "vitest",
  "run",
  "--project",
  "visual",
  ...(update ? ["--update"] : []),
];

if (process.env.HM_VISUAL_CONTAINER === "1") {
  const direct = spawnSync("pnpm", vitestArgs, { cwd: root, stdio: "inherit" });
  process.exit(direct.status ?? 1);
}

const docker = spawnSync("docker", ["info", "--format", "{{.ServerVersion}}"], {
  encoding: "utf8",
});
if (docker.error || docker.status !== 0) {
  fail(
    "Docker isn't available. Install Docker (https://docs.docker.com/get-docker/), start it, and run this again.",
  );
}

const run = (args) => spawnSync("docker", args, { cwd: root, stdio: "inherit" }).status ?? 1;

if (run(["build", "--quiet", "--tag", image, "ci"]) !== 0) {
  fail("the visual test image didn't build.");
}

const owner =
  typeof process.getuid === "function" ? `${process.getuid()}:${process.getgid()}` : "0:0";
const volume = (name, path) => ["--volume", `hm-ui-visual-${name}:/work/${path}`];
const vitest = `pnpm ${vitestArgs.join(" ")}`;

const status = run([
  "run",
  "--rm",
  "--init",
  "--ipc=host",
  "--env",
  "HUSKY=0",
  "--env",
  "STORYBOOK_DISABLE_TELEMETRY=1",
  "--volume",
  `${root}:/work`,
  ...volume("root-modules", "node_modules"),
  ...volume("ui-modules", "packages/ui/node_modules"),
  ...volume("catalogue-modules", "apps/catalogue/node_modules"),
  "--volume",
  "hm-ui-visual-store:/pnpm-store",
  "--workdir",
  "/work",
  image,
  "bash",
  "-c",
  [
    "pnpm install --frozen-lockfile --store-dir /pnpm-store --reporter=silent",
    `${vitest}; status=$?`,
    `chown -R ${owner} apps/catalogue/visual/__screenshots__ 2>/dev/null`,
    "exit $status",
  ].join(" && "),
]);
process.exit(status);
