import { defineMessages } from "@hussmartinez/sdk-core";

/**
 * English text for `@hussmartinez/ui`'s error codes. Applications and SDKs
 * spread it into their catalogue, next to `sdkCoreMessages`, so
 * `messages.error()` can describe a `UiError`. Components add their
 * text here as they arrive.
 *
 * @example
 * ```ts
 * export const en = defineMessages({ ...sdkCoreMessages, ...uiMessages });
 * ```
 *
 * @public
 */
export const uiMessages = /* @__PURE__ */ defineMessages({
  "dialog.close": "Close",
  "errors.INVALID_THEME_TOKEN": "The theme setting {token} has a value that can't be used.",
  "errors.INVALID_THEME_SELECTOR": "The theme can't be applied to the selector {selector}.",
});
