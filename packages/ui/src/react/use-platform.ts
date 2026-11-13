import { type Platform, platformOf } from "@hussmartinez/sdk-core";
import { useSyncExternalStore } from "react";

// The platform doesn't change while the page is open, so nothing to subscribe to.
const subscribe = (): (() => void) => () => undefined;
const onClient = (): Platform => platformOf(globalThis.navigator);
const onServer = (): Platform => "other";

/**
 * The platform whose keyboard conventions apply, for shortcut labels and for
 * sdk-core's `createShortcutRegistry({ platform })`: `"apple"` on macOS, iOS
 * and iPadOS, where `Mod` is `Meta` (⌘), and `"other"` elsewhere, where it's
 * `Control`.
 *
 * A server can't know the platform, so the server render and hydration both
 * use `"other"`, and Apple devices switch to their keys in the render right
 * after hydration. That keeps hydration free of mismatches. Never read
 * `navigator` during render for this.
 *
 * @example
 * ```tsx
 * const platform = usePlatform();
 * const shortcuts = useMemo(() => createShortcutRegistry({ platform, tools }), [platform, tools]);
 * ```
 *
 * @public
 */
export function usePlatform(): Platform {
  return useSyncExternalStore(subscribe, onClient, onServer);
}
