import { createMessages, type Messages, sdkCoreMessages } from "@hussmartinez/sdk-core";
import { createContext, type ReactElement, type ReactNode, useContext } from "react";
import { uiMessages } from "../../messages/en.js";

/**
 * Messages that include `ui`'s text: any sdk-core `Messages` object whose
 * catalogue spreads `uiMessages`.
 *
 * @public
 */
export type UiMessages = Messages<typeof uiMessages>;

const UiMessagesContext = /* @__PURE__ */ createContext<UiMessages | undefined>(undefined);

let english: UiMessages | undefined;

/** English text, created on first use so importing this module does nothing. */
function defaultMessages(): UiMessages {
  english ??= createMessages({ ...sdkCoreMessages, ...uiMessages });
  return english;
}

/**
 * Props of {@link UiMessagesProvider}.
 *
 * @public
 */
export interface UiMessagesProviderProps {
  /** Your catalogue's messages, created with sdk-core's `createMessages`. */
  readonly messages: UiMessages;
  readonly children?: ReactNode;
}

/**
 * Gives `ui`'s components their text (ADR 0014). SDKs and applications pass
 * their message catalogue once, here; a component's own text props still win.
 * Without a provider, components use English.
 *
 * @example
 * ```tsx
 * const messages = createMessages({ ...sdkCoreMessages, ...uiMessages, ...en }, { locale });
 * <UiMessagesProvider messages={messages}>{editor}</UiMessagesProvider>
 * ```
 *
 * @public
 */
export function UiMessagesProvider({ messages, children }: UiMessagesProviderProps): ReactElement {
  return <UiMessagesContext.Provider value={messages}>{children}</UiMessagesContext.Provider>;
}

/**
 * The messages from the closest {@link UiMessagesProvider}, or English.
 *
 * @public
 */
export function useUiMessages(): UiMessages {
  return useContext(UiMessagesContext) ?? defaultMessages();
}

/** Keys of `uiMessages` whose English text has no placeholders. */
type PlainMessageKey = {
  [Key in keyof typeof uiMessages]: (typeof uiMessages)[Key] extends `${string}{${string}`
    ? never
    : Key;
}[keyof typeof uiMessages];

/**
 * A component's text for a message without placeholders: from the closest
 * {@link UiMessagesProvider}, or the English text as it is. Unlike
 * {@link useUiMessages}, it doesn't create a messages object when there's no
 * provider, so components using only English don't ship the formatter.
 */
export function useUiText(key: PlainMessageKey): string {
  const messages = useContext(UiMessagesContext);
  return messages ? messages.t(key) : uiMessages[key];
}

/**
 * The locale of the enclosing `UiMessagesProvider`, or `"en"` without one.
 * It doesn't create the default messages, so components that only need the
 * locale don't ship them.
 */
export function useUiLocale(): string {
  return useContext(UiMessagesContext)?.locale ?? "en";
}
