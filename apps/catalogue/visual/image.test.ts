import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

async function dockerfile(): Promise<string> {
  return readFile(new URL("Dockerfile", import.meta.url), "utf8");
}

describe("the visual test image", () => {
  it("uses the Playwright version the workspace installs", async () => {
    const tag = /playwright:v(\d+\.\d+\.\d+)-/.exec(await dockerfile())?.[1];
    const installed = (require("playwright/package.json") as { version: string }).version;
    expect(tag, "update visual/Dockerfile's tag and digest together with playwright").toBe(
      installed,
    );
  });

  it("is pinned by digest", async () => {
    expect(await dockerfile()).toMatch(/^FROM \S+@sha256:[0-9a-f]{64}$/m);
  });

  it("is the image CI's verify job runs in", async () => {
    const image = /^FROM (\S+)$/m.exec(await dockerfile())?.[1];
    const workflow = await readFile(
      new URL("../../../.github/workflows/verify.yml", import.meta.url),
      "utf8",
    );
    const container = /container:\n\s+image: (\S+)/.exec(workflow)?.[1];
    expect(image).toBeDefined();
    expect(container, "keep verify.yml's container image equal to visual/Dockerfile's").toBe(image);
  });

  it("installs the pnpm version in packageManager", async () => {
    const manifest = JSON.parse(
      await readFile(new URL("../../../package.json", import.meta.url), "utf8"),
    ) as { packageManager: string };
    const pnpm = manifest.packageManager.replace("pnpm@", "");
    expect(await dockerfile()).toContain(`pnpm@${pnpm}`);
  });
});
