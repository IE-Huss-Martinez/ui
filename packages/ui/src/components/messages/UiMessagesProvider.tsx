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
