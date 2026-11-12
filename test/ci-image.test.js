import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

/**
 * The browser test image (docs/adr/0004) and the jobs that run in it. CI's
 * verify job and the release's verify job read the image from ci/Dockerfile
 * through ci-image.yml, which the visual tests build too (ADR 0023).
 */
const read = (/** @type {string} */ path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

/** The image ci/Dockerfile pins, which Dependabot updates. */
async function pinnedImage() {
  const image = /^FROM (\S+)$/m.exec(await read("ci/Dockerfile"))?.[1];
  if (!image) {
    throw new Error("ci/Dockerfile has no FROM line");
  }
  return image;
}

/**
 * @typedef {{ uses?: string, needs?: string | string[], if?: string, container?: { image?: string, options?: string }, env?: Record<string, string>, steps: Array<Record<string, unknown>>, permissions?: Record<string, string> }} Job
 * @param {string} workflow
 * @param {string} name
 * @returns {Promise<Job>}
 */
async function job(workflow, name) {
  const found = parse(await read(`.github/workflows/${workflow}`)).jobs?.[name];
  if (!found) {
    throw new Error(`${workflow} has no ${name} job`);
  }
  return found;
}

// A GitHub Actions expression, not a JavaScript placeholder.
const CONTAINER_IMAGE = `\${{ needs.image.outputs.ref || 'the-image-job-failed' }}`;

describe("the browser test image", () => {
  it("is Microsoft's Playwright image, pinned by digest", async () => {
    expect(await pinnedImage()).toMatch(
      /^mcr\.microsoft\.com\/playwright:v\d+\.\d+\.\d+-noble@sha256:[0-9a-f]{64}$/,
    );
  });

  it("has the Playwright version the workspace installs", async () => {
    const tag = /playwright:v(\d+\.\d+\.\d+)-/.exec(await pinnedImage())?.[1];
    // Resolved from the package, whose browser tests use it.
    const require = createRequire(new URL("../packages/ui/package.json", import.meta.url));
    const installed = require("playwright/package.json").version;
    expect(tag, "update ci/Dockerfile's tag and digest together with playwright").toBe(installed);
  });

  it("installs the pnpm version in packageManager", async () => {
    const { packageManager } = JSON.parse(await read("package.json"));
    expect(await read("ci/Dockerfile")).toContain(`pnpm@${packageManager.replace("pnpm@", "")}`);
  });

  it.each([
    ["verify.yml", "verify"],
    ["release.yml", "verify"],
  ])("is the image %s's %s job runs in, read through ci-image.yml", async (workflow, name) => {
    const image = await job(workflow, "image");
    expect(image.uses).toBe("./.github/workflows/ci-image.yml");
    expect(image.permissions).toEqual({ contents: "read" });
    const { container, needs } = await job(workflow, name);
    expect(container?.image).toBe(CONTAINER_IMAGE);
    expect(container?.options).toBe("--user 1001 --ipc=host --init");
    expect([needs].flat()).toContain("image");
    // One place for the image: no workflow names one of its own.
    expect(await read(`.github/workflows/${workflow}`)).not.toContain(
      "mcr.microsoft.com/playwright:v",
    );
  });

  it("makes a failed image job fail verify, rather than skip it", async () => {
    for (const workflow of ["verify.yml", "release.yml"]) {
      expect((await job(workflow, "verify")).if, workflow).toContain("!cancelled()");
    }
  });
});

describe("ci-image.yml's check of ci/Dockerfile", () => {
  /** Runs the "Read the image" step's script against a Dockerfile. */
  async function readImage(/** @type {string} */ dockerfile) {
    const workflow = parse(await read(".github/workflows/ci-image.yml"));
    const step = workflow.jobs.read.steps.find(
      (/** @type {Record<string, unknown>} */ s) => s["name"] === "Read the image",
    );
    const directory = await mkdtemp(join(tmpdir(), "hm-ui-ci-image-"));
    try {
      await mkdir(join(directory, "ci"));
      await writeFile(join(directory, "ci", "Dockerfile"), dockerfile);
      const output = join(directory, "output");
      await writeFile(output, "");
      const run = spawnSync("bash", ["-e", "-c", step.run], {
        cwd: directory,
        env: { ...process.env, GITHUB_OUTPUT: output },
        encoding: "utf8",
      });
      return { status: run.status, output: await readFile(output, "utf8") };
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  const digest = "a".repeat(64);
  const valid = `mcr.microsoft.com/playwright:v1.65.0-noble@sha256:${digest}`;

  it("outputs a valid image reference", async () => {
    await expect(readImage(`# comment\nFROM ${valid}\nRUN true\n`)).resolves.toEqual({
      status: 0,
      output: `ref=${valid}\n`,
    });
  });

  it.each([
    ["two FROM lines", `FROM ${valid}\nFROM node\n`],
    ["no FROM line", "RUN true\n"],
    ["a tag without a digest", "FROM mcr.microsoft.com/playwright:v1.65.0-noble\n"],
    ["another registry", `FROM evil.example/playwright:v1.65.0-noble@sha256:${digest}\n`],
    ["trailing text", `FROM ${valid} AS base\n`],
    ["a short digest", "FROM mcr.microsoft.com/playwright:v1.65.0-noble@sha256:abc\n"],
  ])("rejects %s", async (_name, dockerfile) => {
    await expect(readImage(dockerfile)).resolves.toEqual({ status: 1, output: "" });
  });
});

describe("the release workflow", () => {
  it("verifies a release exactly as pull requests are verified", async () => {
    const pullRequests = await job("verify.yml", "verify");
    const release = await job("release.yml", "verify");
    // The same steps, except that a release doesn't use pnpm's store cache.
    const withoutCache = pullRequests.steps.map((step) =>
      String(step["uses"] ?? "").startsWith("pnpm/action-setup@") ? { uses: step["uses"] } : step,
    );
    expect(release.steps).toEqual(withoutCache);
    expect(release.env).toEqual(pullRequests.env);
    expect(release.permissions).toEqual({ contents: "read" });
  });

  it("publishes only after the release's verify job", async () => {
    const publish = await job("release.yml", "publish");
    expect(publish).toMatchObject({ needs: expect.arrayContaining(["plan", "verify"]) });
    const check = publish.steps.find(
      (step) => step["name"] === "Check that this release was verified",
    );
    // A GitHub Actions expression, not a JavaScript placeholder.
    expect(check?.["env"]).toEqual({ VERIFIED: `\${{ needs.verify.result }}` });
    const publishing = publish.steps.findIndex((step) =>
      String(step["uses"] ?? "").startsWith("changesets/action@"),
    );
    expect(publish.steps.indexOf(/** @type {Record<string, unknown>} */ (check))).toBeLessThan(
      publishing,
    );
    // No browsers are installed where the OIDC token is.
    expect(JSON.stringify(publish.steps)).not.toContain("playwright install");
  });
});
