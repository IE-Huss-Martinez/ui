import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REGISTRY = Symbol.for("@hussmartinez/ui");

/** A fresh module instance stands for another copy of ui, as a second install would be. */
async function loadCopy(): Promise<typeof import("./single-copy.js")> {
  vi.resetModules();
  return import("./single-copy.js");
}

beforeEach(() => {
  delete (globalThis as Record<symbol, unknown>)[REGISTRY];
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  delete (globalThis as Record<symbol, unknown>)[REGISTRY];
});

describe("the single-copy check", () => {
  it("is quiet with one copy, however often it runs", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const copy = await loadCopy();
    copy.checkSingleCopy();
    copy.checkSingleCopy();
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns once when a second copy is used, naming the command to find it", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const first = await loadCopy();
    first.checkSingleCopy();
    const second = await loadCopy();
    second.checkSingleCopy();
    second.checkSingleCopy();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(
        /2 copies of @hussmartinez\/ui are in use \(.+, .+\)\..*npm ls @hussmartinez\/ui/,
      ),
    );
  });

  it("counts two installs of the same version as two copies", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    (await loadCopy()).checkSingleCopy();
    (await loadCopy()).checkSingleCopy();
    const [message] = warn.mock.calls[0] ?? [];
    // Without the build's version, both copies report the same placeholder.
    expect(message).toContain("(an unknown version, an unknown version)");
  });

  it("does nothing in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    (await loadCopy()).checkSingleCopy();
    (await loadCopy()).checkSingleCopy();
    expect(warn).not.toHaveBeenCalled();
    expect((globalThis as Record<symbol, unknown>)[REGISTRY]).toBeUndefined();
  });

  it("registers nothing on import", async () => {
    await loadCopy();
    expect((globalThis as Record<symbol, unknown>)[REGISTRY]).toBeUndefined();
  });
});
