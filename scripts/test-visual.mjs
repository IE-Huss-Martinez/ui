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
 * The container gets its own node_modules volumes, for the root and for every
 * workspace package, so its install never writes into the checkout and
 * binaries installed for the host never mix with the container's. Its own
 * pnpm store volume makes installs after the first fast. It runs as root, so
 * afterwards every root-owned file in the checkout, such as screenshots and
 * Vitest's attachments, is handed back to the calling user.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { workspacePackageDirs } from "./workspace-packages.mjs";

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
  // One per package: pnpm installs into each, and a package left out would
  // get root-owned node_modules in the host's checkout.
  ...workspacePackageDirs(root).flatMap((dir) =>
    volume(`${dir.replaceAll("/", "-")}-modules`, `${dir}/node_modules`),
  ),
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
    // -xdev stays on the checkout's filesystem, out of the volumes. It never
    // fails the run: the tests' status is what counts.
    `{ find /work -xdev -user 0 -exec chown ${owner} {} + 2>/dev/null || true; }`,
    "exit $status",
  ].join(" && "),
]);
process.exit(status);
