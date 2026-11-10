import { createMessages, sdkCoreMessages } from "@hussmartinez/sdk-core";
import { describe, expect, it } from "vitest";
import { UiError, type UiErrorCode } from "../errors/ui-error.js";
import { uiMessages } from "./en.js";

describe("uiMessages", () => {
  it("has text for every UiError code", () => {
    const codes: Record<UiErrorCode, true> = {
      INVALID_THEME_TOKEN: true,
      INVALID_THEME_SELECTOR: true,
    };
    for (const code of Object.keys(codes)) {
      expect(uiMessages).toHaveProperty(`errors.${code}`);
    }
  });

  it("describes a UiError with its details, never its message", () => {
    const messages = createMessages({ ...sdkCoreMessages, ...uiMessages });
    const error = new UiError("INVALID_THEME_TOKEN", "internal text", {
      details: { token: "color-accent", value: "16px", reason: "wrong type" },
    });
    expect(messages.error(error)).toBe(
      "The theme setting color-accent has a value that can't be used.",
    );
  });
});
