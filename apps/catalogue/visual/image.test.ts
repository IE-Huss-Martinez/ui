import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

/** The browser test image, read by CI and the visual tests (docs/adr/0004). */
async function dockerfile(): Promise<string> {
  return readFile(new URL("../../../ci/Dockerfile", import.meta.url), "utf8");
}

describe("the browser test image", () => {
  it("uses the Playwright version the workspace installs", async () => {
    const tag = /playwright:v(\d+\.\d+\.\d+)-/.exec(await dockerfile())?.[1];
    const installed = (require("playwright/package.json") as { version: string }).version;
    expect(tag, "update ci/Dockerfile's tag and digest together with playwright").toBe(installed);
  });

  it("is pinned by digest", async () => {
    expect(await dockerfile()).toMatch(/^FROM \S+@sha256:[0-9a-f]{64}$/m);
  });

  it("is where CI's verify job takes its image from, with no second copy", async () => {
    const workflow = await readFile(
      new URL("../../../.github/workflows/verify.yml", import.meta.url),
      "utf8",
    );
    expect(workflow).toContain("ci/Dockerfile");
    expect(workflow).toMatch(/container:\n\s+image: \$\{\{ needs\.image\.outputs\.ref/);
    expect(workflow, "the image belongs in ci/Dockerfile only").not.toContain(
      "mcr.microsoft.com/playwright:v",
    );
  });

  it("installs the pnpm version in packageManager", async () => {
    const manifest = JSON.parse(
      await readFile(new URL("../../../package.json", import.meta.url), "utf8"),
    ) as { packageManager: string };
    const pnpm = manifest.packageManager.replace("pnpm@", "");
    expect(await dockerfile()).toContain(`pnpm@${pnpm}`);
  });
});
