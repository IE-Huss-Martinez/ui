import { act, useRef, useState } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { addStyle, cleanUp, loadStyles, mount } from "../../test/dom.js";
import { Button } from "../button/Button.js";
import { Dialog } from "./Dialog.js";

let root: Root | undefined;

beforeEach(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  await loadStyles();
});
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  cleanUp();
  vi.restoreAllMocks();
});

function render(element: React.ReactElement): HTMLElement {
  const container = mount("");
  act(() => {
    root = createRoot(container);
    root.render(element);
  });
  return container;
}

const dialogOf = (container: HTMLElement): HTMLDialogElement =>
  container.querySelector("dialog") as HTMLDialogElement;

/** A typical host: a button opens the dialog, which can refuse to close. */
function Host({ refuse = false, withInitialFocus = false }) {
  const [open, setOpen] = useState(false);
  const name = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Button>Elsewhere</Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!refuse) {
            setOpen(next);
          }
        }}
        title="Rename"
        description="Pick a new name."
        initialFocus={withInitialFocus ? name : undefined}
      >
        <input ref={name} aria-label="Name" />
      </Dialog>
    </>
  );
}

async function openFromButton(container: HTMLElement): Promise<HTMLDialogElement> {
  await userEvent.click(container.querySelector("button") as HTMLElement);
  const dialog = dialogOf(container);
  await vi.waitFor(() => expect(dialog.open).toBe(true));
  return dialog;
}

function Opened() {
  return (
    <Dialog open onOpenChange={() => undefined} title="Hello">
      Body
    </Dialog>
  );
}

function Long({ lines }: { lines: number }) {
  return (
    <Dialog open onOpenChange={() => undefined} title="Shortcuts">
      {Array.from({ length: lines }, (_, index) => (
        <p key={String(index)}>Line {index + 1}</p>
      ))}
    </Dialog>
  );
}

/**
 * Adds a long list under a heading that stays, like results arriving. No
 * element the dialog already watches changes size.
 */
function Swapping({ long }: { long: boolean }) {
  return (
    <Dialog
      open
      onOpenChange={() => undefined}
      title="Results"
      classNames={{ body: "hm-test-capped-body" }}
    >
      <p key="heading">Results so far</p>
      {long ? (
        <ul key="list">
          {Array.from({ length: 50 }, (_, index) => (
            <li key={String(index)}>Result {index + 1}</li>
          ))}
        </ul>
      ) : null}
    </Dialog>
  );
}

describe("Dialog", () => {
  it("opens as a modal with showModal, labelled by its title", async () => {
    const container = render(<Host />);
    const dialog = await openFromButton(container);
    expect(dialog.matches(":modal")).toBe(true);
    const title = document.getElementById(dialog.getAttribute("aria-labelledby") ?? "");
    expect(title?.textContent).toBe("Rename");
    const description = document.getElementById(dialog.getAttribute("aria-describedby") ?? "");
    expect(description?.textContent).toBe("Pick a new name.");
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("makes the page behind inert", async () => {
    const container = render(<Host />);
    await openFromButton(container);
    const elsewhere = container.querySelectorAll("button")[1] as HTMLButtonElement;
    elsewhere.focus();
    expect(document.activeElement).not.toBe(elsewhere);
  });

  it("focuses initialFocus when it opens", async () => {
    const container = render(<Host withInitialFocus />);
    await openFromButton(container);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Name");
  });

  it("asks to close on Escape through cancel, and closes when open becomes false", async () => {
    const container = render(<Host />);
    const dialog = await openFromButton(container);
    await userEvent.keyboard("{Escape}");
    await vi.waitFor(() => expect(dialog.open).toBe(false));
  });

  it("stays open on Escape when the host refuses, because cancel is prevented", async () => {
    const container = render(<Host refuse />);
    const dialog = await openFromButton(container);
    const cancel = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(dialog.open).toBe(true);
  });

  it("returns focus to the opener when it closes", async () => {
    const container = render(<Host />);
    await openFromButton(container);
    await userEvent.click(container.querySelector(".hm-dialog-close") as HTMLElement);
    await vi.waitFor(() => expect(dialogOf(container).open).toBe(false));
    expect(document.activeElement?.textContent).toBe("Open");
  });

  it("contains scrolling and lets the body scroll", async () => {
    const container = render(<Host />);
    const dialog = await openFromButton(container);
    expect(getComputedStyle(dialog).overscrollBehaviorY).toBe("contain");
    const body = dialog.querySelector(".hm-dialog-body") as Element;
    expect(getComputedStyle(body).overscrollBehaviorY).toBe("contain");
    expect(getComputedStyle(body).overflowY).toBe("auto");
  });

  it("makes a scrolling body a Tab stop, and a short one not", async () => {
    const short = render(<Long lines={1} />);
    await vi.waitFor(() => expect(dialogOf(short).open).toBe(true));
    expect(dialogOf(short).querySelector(".hm-dialog-body")?.hasAttribute("tabindex")).toBe(false);
    act(() => root?.render(<Long lines={200} />));
    await vi.waitFor(() =>
      expect(dialogOf(short).querySelector(".hm-dialog-body")?.getAttribute("tabindex")).toBe("0"),
    );
  });

  it("notices content added after opening while the body's size can't change", async () => {
    // A body at its maximum size doesn't resize when its content changes, so
    // only the content can tell it now overflows. The gutter is reserved up
    // front, as with overlay scrollbars, so no scrollbar resizes it either.
    addStyle(".hm-test-capped-body { block-size: 6rem; flex: none; scrollbar-gutter: stable; }");
    const container = render(<Swapping long={false} />);
    await vi.waitFor(() => expect(dialogOf(container).open).toBe(true));
    const body = dialogOf(container).querySelector(".hm-dialog-body") as HTMLElement;
    expect(body.hasAttribute("tabindex")).toBe(false);
    // Let the observers deliver their first notifications, so only the
    // change below can trigger a check.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    act(() => root?.render(<Swapping long />));
    // The attribute, not the tabIndex property: browsers report 0 for any
    // scrollable region, but axe and assistive technology need the attribute.
    await vi.waitFor(() => expect(body.getAttribute("tabindex")).toBe("0"));
  });

  it("hydrates closed without errors, then opens", async () => {
    const container = mount(renderToString(<Opened />));
    const consoleError = vi.spyOn(console, "error");
    const recoverable: unknown[] = [];
    act(() => {
      root = hydrateRoot(container, <Opened />, { onRecoverableError: (e) => recoverable.push(e) });
    });
    expect(recoverable).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(dialogOf(container).open).toBe(true));
  });
});
