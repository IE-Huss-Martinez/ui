import { createMessages, defineMessages, sdkCoreMessages } from "@hussmartinez/sdk-core";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { uiMessages } from "../../messages/en.js";
import { UiMessagesProvider } from "../messages/UiMessagesProvider.js";
import { Dialog } from "./Dialog.js";

const noop = (): void => undefined;

describe("Dialog on the server", () => {
  it("renders closed, labelled by its title and described by its description", () => {
    const html = renderToString(
      <Dialog open onOpenChange={noop} title="Export" description="Choose a format.">
        Body
      </Dialog>,
    );
    expect(html).toMatch(
      /^<dialog aria-labelledby="([^"]+)" aria-describedby="([^"]+)" class="hm-dialog">/,
    );
    expect(html).not.toMatch(/<dialog[^>]* open/);
    const [, titleId, descriptionId] =
      /aria-labelledby="([^"]+)" aria-describedby="([^"]+)"/.exec(html) ?? [];
    expect(html).toContain(`<h2 id="${titleId}" class="hm-dialog-title">Export</h2>`);
    expect(html).toContain(
      `<p id="${descriptionId}" class="hm-dialog-description">Choose a format.</p>`,
    );
    expect(html).toContain('<div class="hm-dialog-body">Body</div>');
  });

  it("names the close button from the messages, or from closeLabel", () => {
    expect(renderToString(<Dialog open={false} onOpenChange={noop} title="T" />)).toContain(
      'aria-label="Close"',
    );
    expect(
      renderToString(<Dialog open={false} onOpenChange={noop} title="T" closeLabel="Dismiss" />),
    ).toContain('aria-label="Dismiss"');
    const french = createMessages(
      defineMessages({ ...sdkCoreMessages, ...uiMessages, "dialog.close": "Fermer" }),
      { locale: "fr" },
    );
    expect(
      renderToString(
        <UiMessagesProvider messages={french}>
          <Dialog open={false} onOpenChange={noop} title="T" />
        </UiMessagesProvider>,
      ),
    ).toContain('aria-label="Fermer"');
  });

  it("renders sizes, parts, a footer and unstyled", () => {
    const html = renderToString(
      <Dialog
        open={false}
        onOpenChange={noop}
        title="T"
        size="large"
        footer="Actions"
        unstyled
        classNames={{ root: "r", body: "b", footer: "f", close: "c" }}
      />,
    );
    expect(html).toContain('class="hm-dialog hm-dialog--large r"');
    expect(html).toContain('data-hm-unstyled=""');
    expect(html).toContain('<div class="hm-dialog-footer f">Actions</div>');
    expect(html).toContain('<div class="hm-dialog-body b"></div>');
    expect(html).toContain("hm-dialog-close c");
    expect(html).not.toContain("aria-describedby");
  });
});
