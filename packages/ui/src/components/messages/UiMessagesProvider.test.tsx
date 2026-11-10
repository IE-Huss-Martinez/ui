import { createMessages, defineMessages, sdkCoreMessages } from "@hussmartinez/sdk-core";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { uiMessages } from "../../messages/en.js";
import { UiMessagesProvider, useUiMessages } from "./UiMessagesProvider.js";

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
