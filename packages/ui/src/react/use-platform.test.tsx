import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { usePlatform } from "./use-platform.js";

function Label() {
  return <kbd>{usePlatform() === "apple" ? "⌘" : "Ctrl"}</kbd>;
}

const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");

afterEach(() => {
  if (original) {
    Object.defineProperty(globalThis, "navigator", original);
  }
});

describe("usePlatform on the server", () => {
  it("renders the other platform, even where the server's own navigator is Apple's", () => {
    // Node has a navigator; a server on a Mac must still render "other".
    Object.defineProperty(globalThis, "navigator", {
      value: { platform: "MacIntel", userAgent: "Node.js" },
      configurable: true,
    });
    expect(renderToString(<Label />)).toBe("<kbd>Ctrl</kbd>");
  });
});
