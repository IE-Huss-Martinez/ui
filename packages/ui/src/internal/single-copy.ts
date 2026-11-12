import { warnInDevelopment } from "./development.js";

declare const process: { readonly env: { readonly NODE_ENV?: string } };

/**
 * ui's version, written in by the library build. Pipelines that compile the
 * source themselves, such as the catalogue and the tests, may leave it out.
 */
declare const __HM_UI_VERSION__: string | undefined;

/** Where every copy of ui on the page registers itself, shared across copies. */
const REGISTRY = /* @__PURE__ */ Symbol.for("@hussmartinez/ui");

/** This copy's identity: two installs of the same version are still two copies. */
const THIS_COPY = {};

let checked = false;

/** This copy's version, or a placeholder where the build didn't write it in. */
function ownVersion(): string {
  return typeof __HM_UI_VERSION__ === "string" ? __HM_UI_VERSION__ : "an unknown version";
}

/**
 * Warns once, in development, when a second copy of ui is used on the page
 * (ADR 0036, in sdk-core). Each copy's context is its own, so a provider from
 * one copy doesn't reach components from another: they fall back to English,
 * and announcements go nowhere.
 *
 * Called on first use by ui's providers and context hooks, never on import,
 * so importing ui stays free of side effects. It does nothing in production.
 */
export function checkSingleCopy(): void {
  // Inline, so production bundles drop the whole check.
  if (checked || !(typeof process !== "undefined" && process.env.NODE_ENV !== "production")) {
    return;
  }
  checked = true;
  const global = globalThis as { [REGISTRY]?: Map<object, string> };
  const copies = global[REGISTRY] ?? new Map<object, string>();
  global[REGISTRY] = copies;
  copies.set(THIS_COPY, ownVersion());
  if (copies.size > 1) {
    if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
      warnInDevelopment(
        `${copies.size} copies of @hussmartinez/ui are in use (${[...copies.values()].join(", ")}). Providers from one copy don't reach components from another, so text falls back to English and announcements are lost. Install a single version: \`npm ls @hussmartinez/ui\` shows where each comes from, and every SDK and your application should use the same minor version.`,
      );
    }
  }
}
