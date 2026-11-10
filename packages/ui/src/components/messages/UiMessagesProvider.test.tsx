import { createMessages, defineMessages, sdkCoreMessages } from "@hussmartinez/sdk-core";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { uiMessages } from "../../messages/en.js";
import { UiMessagesProvider, useUiMessages, useUiText } from "./UiMessagesProvider.js";

function ErrorText() {
  return <>{useUiMessages().t("errors.INVALID_THEME_SELECTOR", { selector: ".x" })}</>;
}

describe("UiMessagesProvider", () => {
  it("defaults to English", () => {
    expect(renderToString(<ErrorText />)).toBe(
      "The theme can&#x27;t be applied to the selector .x.",
    );
  });

  it("takes a host's catalogue, which can be larger than ui's", () => {
    const catalogue = defineMessages({
      ...sdkCoreMessages,
      ...uiMessages,
      "errors.INVALID_THEME_SELECTOR": "Le thème ne s'applique pas à {selector}.",
      "toolbar.rotate": "Pivoter",
    });
    const messages = createMessages(catalogue, { locale: "fr" });
    expect(
      renderToString(
        <UiMessagesProvider messages={messages}>
          <ErrorText />
        </UiMessagesProvider>,
      ),
    ).toBe("Le thème ne s&#x27;applique pas à .x.");
  });
});

function CloseText() {
  return <>{useUiText("dialog.close")}</>;
}

describe("useUiText", () => {
  it("uses the English text without a provider, and the provider's text with one", () => {
    expect(renderToString(<CloseText />)).toBe("Close");
    const messages = createMessages(
      defineMessages({ ...sdkCoreMessages, ...uiMessages, "dialog.close": "Fermer" }),
      { locale: "fr" },
    );
    expect(
      renderToString(
        <UiMessagesProvider messages={messages}>
          <CloseText />
        </UiMessagesProvider>,
      ),
    ).toBe("Fermer");
  });

  it("only accepts messages without placeholders", () => {
    type Key = Parameters<typeof useUiText>[0];
    const plain: Key = "dialog.close";
    // @ts-expect-error: this message has a {token} placeholder, which needs formatting.
    const formatted: Key = "errors.INVALID_THEME_TOKEN";
    expect([plain, formatted]).toHaveLength(2);
  });
});
