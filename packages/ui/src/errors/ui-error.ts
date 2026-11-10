import { SdkError } from "@hussmartinez/sdk-core";

/**
 * Error codes of `@hussmartinez/ui`. They never change once released.
 *
 * - `INVALID_THEME_TOKEN`: a theme token has an unknown name, or a value that
 *   isn't allowed for its type. `details` has `token`, `value` and `reason`.
 * - `INVALID_THEME_SELECTOR`: the selector passed to `themeToCss` isn't a
 *   plain CSS selector. `details` has `selector` and `reason`.
 *
 * @public
 */
export type UiErrorCode = "INVALID_THEME_TOKEN" | "INVALID_THEME_SELECTOR";

/**
 * The error `@hussmartinez/ui` throws, with a stable `code` and structured
 * `details`. Show users the text for its code from {@link uiMessages}, never
 * its `message`.
 *
 * @example
 * ```ts
 * try {
 *   createTheme({ extends: "light", tokens: { "color-accent": brandColour } });
 * } catch (error) {
 *   if (isSdkError(error, "INVALID_THEME_TOKEN")) {
 *     // Ask for another colour.
 *   }
 * }
 * ```
 *
 * @public
 */
export class UiError extends SdkError<UiErrorCode> {
  override readonly name = "UiError";
}
