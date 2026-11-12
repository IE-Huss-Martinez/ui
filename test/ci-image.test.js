// The browser test image (docs/adr/0004), in its only copy, ci/Dockerfile.
// CI's verify jobs read it through sdk-ci's image action, and sdk-ci's
// check-workflows step keeps the workflows equal to sdk-ci's skeleton (ADR
// 0026, in sdk-core). What only this repository can check is here: that the
// image is pinned, and that it matches this workspace's Playwright and pnpm.
import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

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

describe("the browser test image", () => {
  it("has exactly one FROM line", async () => {
    // sdk-ci's image action requires it, and fails CI otherwise.
    const lines = (await read("ci/Dockerfile")).split("\n");
    expect(lines.filter((line) => line.startsWith("FROM "))).toHaveLength(1);
  });

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

  it("has no copy in any workflow", async () => {
    const workflows = await readdir(new URL("../.github/workflows/", import.meta.url));
    expect(workflows.length).toBeGreaterThan(0);
    for (const workflow of workflows) {
      expect(
        await read(`.github/workflows/${workflow}`),
        `the image belongs in ci/Dockerfile only, not ${workflow}`,
      ).not.toContain("mcr.microsoft.com/playwright:v");
    }
  });
});
