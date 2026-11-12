import { act, createRef } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { cleanUp, loadStyles, mount } from "../../test/dom.js";
import { FileDropZone, type FileDropZoneProps } from "./FileDropZone.js";

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

const pdf = (name = "report.pdf") => new File(["%PDF-1.7"], name, { type: "application/pdf" });

/** A drag carrying files, as the operating system sends it. */
function transfer(...files: File[]): DataTransfer {
  const data = new DataTransfer();
  for (const file of files) {
    data.items.add(file);
  }
  return data;
}

/** Fires a drag event and returns it, to check what the page did with it. */
function drag(target: EventTarget, type: string, data: DataTransfer): DragEvent {
  const event = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: data });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

/**
 * Whether this engine keeps a dropEffect written to a constructed
 * DataTransfer. Firefox does; Chromium and WebKit only do during a real drag,
 * so there the tests check what's testable: that the event was cancelled.
 */
const keepsDropEffect = (() => {
  const probe = new DataTransfer();
  probe.dropEffect = "copy";
  return probe.dropEffect === "copy";
})();

function renderZone(props: Partial<FileDropZoneProps> = {}) {
  const onFiles = vi.fn();
  const onFilesRejected = vi.fn();
  const container = render(
    <FileDropZone
      accept=".pdf,application/pdf"
      onFiles={onFiles}
      onFilesRejected={onFilesRejected}
      {...props}
    >
      <p>Open a document</p>
    </FileDropZone>,
  );
  const zone = container.querySelector(".hm-file-drop-zone") as HTMLElement;
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  return { zone, input, onFiles, onFilesRejected };
}

/** Chooses files in the picker, as the browser reports them. */
function choose(input: HTMLInputElement, ...files: File[]): void {
  act(() => {
    input.files = transfer(...files).files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("FileDropZone", () => {
  it("is reached by keyboard through a named, described button that opens the picker", async () => {
    const { input } = renderZone();
    const open = vi.spyOn(input, "click").mockImplementation(() => undefined);
    const button = page.getByRole("button", { name: "Choose a file" });
    await expect.element(button).toHaveAccessibleDescription("or drop it here");
    await userEvent.tab();
    await expect.element(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(open).toHaveBeenCalledTimes(2);
    // The zone and the input themselves aren't in the Tab order.
    await userEvent.tab();
    expect(document.activeElement).toBe(document.body);
  });

  it("delivers chosen files, and clears the input so the same file can be chosen again", () => {
    const { input, onFiles } = renderZone();
    const file = pdf();
    choose(input, file);
    expect(onFiles).toHaveBeenCalledWith([file]);
    expect(input.value).toBe("");
    choose(input, file);
    expect(onFiles).toHaveBeenCalledTimes(2);
  });

  it("delivers dropped files, and marks the zone while files are over it", () => {
    const { zone, onFiles } = renderZone();
    const file = pdf();
    const data = transfer(file);
    const enter = drag(zone, "dragenter", data);
    expect(enter.defaultPrevented).toBe(true);
    expect(zone.hasAttribute("data-hm-dragging")).toBe(true);
    const over = drag(zone, "dragover", data);
    expect(over.defaultPrevented).toBe(true);
    if (keepsDropEffect) {
      expect(data.dropEffect).toBe("copy");
    }
    const drop = drag(zone, "drop", data);
    expect(drop.defaultPrevented).toBe(true);
    expect(onFiles).toHaveBeenCalledWith([file]);
    expect(zone.hasAttribute("data-hm-dragging")).toBe(false);
  });

  it("doesn't flicker as the drag crosses its children", () => {
    const { zone } = renderZone();
    const child = zone.querySelector("p") as HTMLElement;
    const button = zone.querySelector("button") as HTMLElement;
    const data = transfer(pdf());
    const observer = new MutationObserver(() => undefined);
    observer.observe(zone, {
      attributes: true,
      attributeFilter: ["data-hm-dragging"],
      attributeOldValue: true,
    });
    // Browsers fire dragenter on the new element before dragleave on the old.
    drag(zone, "dragenter", data);
    drag(child, "dragenter", data);
    drag(zone, "dragleave", data);
    drag(button, "dragenter", data);
    drag(child, "dragleave", data);
    drag(zone, "dragenter", data);
    drag(button, "dragleave", data);
    expect(zone.hasAttribute("data-hm-dragging")).toBe(true);
    drag(zone, "dragleave", data);
    expect(zone.hasAttribute("data-hm-dragging")).toBe(false);
    // Records arrive asynchronously, so take them now. On once, off once:
    // never off while the drag was over a child. The old value is null when
    // the attribute was added, and "" when it was removed.
    const changes = observer.takeRecords().map((record) => record.oldValue);
    observer.disconnect();
    expect(changes).toEqual([null, ""]);
  });

  it("ignores drags that carry no files, such as selected text", () => {
    const { zone } = renderZone();
    const text = new DataTransfer();
    text.setData("text/plain", "hello");
    expect(drag(zone, "dragenter", text).defaultPrevented).toBe(false);
    expect(zone.hasAttribute("data-hm-dragging")).toBe(false);
    expect(drag(document.body, "dragover", text).defaultPrevented).toBe(false);
  });

  it("checks accept and multiple for drops and the picker, and reports what it turned away", () => {
    const { zone, input, onFiles, onFilesRejected } = renderZone();
    const notes = new File(["hi"], "notes.txt", { type: "text/plain" });
    drag(zone, "drop", transfer(notes));
    expect(onFiles).not.toHaveBeenCalled();
    expect(onFilesRejected).toHaveBeenLastCalledWith([{ file: notes, reason: "type" }]);
    const [a, b] = [pdf("a.pdf"), pdf("b.pdf")];
    choose(input, a, b);
    expect(onFiles).not.toHaveBeenCalled();
    expect(onFilesRejected).toHaveBeenLastCalledWith([
      { file: a, reason: "count" },
      { file: b, reason: "count" },
    ]);
  });

  it("takes several files with multiple, and still turns away the wrong types", () => {
    const { zone, onFiles, onFilesRejected } = renderZone({ multiple: true });
    const [a, b] = [pdf("a.pdf"), pdf("b.pdf")];
    const notes = new File(["hi"], "notes.txt", { type: "text/plain" });
    drag(zone, "drop", transfer(a, notes, b));
    expect(onFiles).toHaveBeenCalledWith([a, b]);
    expect(onFilesRejected).toHaveBeenCalledWith([{ file: notes, reason: "type" }]);
  });

  it("never reads a file", () => {
    const reads = [
      ...(["text", "arrayBuffer", "stream", "slice", "bytes"] as const)
        .filter((method) => method in Blob.prototype)
        .map((method) => vi.spyOn(Blob.prototype, method as "text")),
      ...(["readAsArrayBuffer", "readAsText", "readAsDataURL", "readAsBinaryString"] as const).map(
        (method) => vi.spyOn(FileReader.prototype, method),
      ),
    ];
    const { zone, input, onFiles } = renderZone({ multiple: true });
    drag(zone, "drop", transfer(pdf("a.pdf"), new File(["x"], "b.txt")));
    choose(input, pdf("c.pdf"));
    expect(onFiles).toHaveBeenCalledTimes(2);
    for (const read of reads) {
      expect(read).not.toHaveBeenCalled();
    }
  });

  it("doesn't put a file's name on the page", () => {
    const { zone, onFiles } = renderZone();
    const hostile = pdf('<img src=x onerror="window.__hm_pwned=1">.pdf');
    drag(zone, "drop", transfer(hostile));
    expect(onFiles).toHaveBeenCalledWith([hostile]);
    expect(zone.querySelector("img")).toBeNull();
    expect(zone.textContent).not.toContain("onerror");
    expect((window as { __hm_pwned?: number }).__hm_pwned).toBeUndefined();
  });

  it("turns away files dropped beside it, so the page doesn't navigate to them", () => {
    renderZone();
    const data = transfer(pdf());
    const over = drag(document.body, "dragover", data);
    expect(over.defaultPrevented).toBe(true);
    if (keepsDropEffect) {
      expect(data.dropEffect).toBe("none");
    }
    expect(drag(document.body, "drop", data).defaultPrevented).toBe(true);
  });

  it("leaves drops elsewhere alone once it's gone, and when the host takes them", () => {
    renderZone();
    const data = transfer(pdf());
    // A host drop target of its own handles its drags first.
    const target = document.createElement("div");
    document.body.append(target);
    target.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (event instanceof DragEvent && event.dataTransfer) {
        event.dataTransfer.dropEffect = "link";
      }
    });
    expect(drag(target, "dragover", data).defaultPrevented).toBe(true);
    if (keepsDropEffect) {
      // The zone's page-wide guard left the host's choice alone.
      expect(data.dropEffect).toBe("link");
    }
    target.remove();
    act(() => root?.unmount());
    root = undefined;
    expect(drag(document.body, "dragover", transfer(pdf())).defaultPrevented).toBe(false);
  });

  it("ignores drops and shows no drag state while disabled", () => {
    const { zone, onFiles } = renderZone({ disabled: true });
    const data = transfer(pdf());
    drag(zone, "dragenter", data);
    expect(zone.hasAttribute("data-hm-dragging")).toBe(false);
    expect(drag(zone, "dragover", data).defaultPrevented).toBe(true);
    if (keepsDropEffect) {
      expect(data.dropEffect).toBe("none");
    }
    expect(drag(zone, "drop", data).defaultPrevented).toBe(true);
    expect(onFiles).not.toHaveBeenCalled();
    expect((zone.querySelector("button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the drag state with a solid accent border, not colour alone", () => {
    const { zone } = renderZone();
    const before = getComputedStyle(zone);
    expect(before.borderTopStyle).toBe("dashed");
    drag(zone, "dragenter", transfer(pdf()));
    const during = getComputedStyle(zone);
    expect(during.borderTopStyle).toBe("solid");
  });

  it("keeps its layout unstyled, and drops the border", () => {
    const container = render(
      <>
        <FileDropZone onFiles={() => undefined} />
        <FileDropZone unstyled onFiles={() => undefined} />
      </>,
    );
    const [styled, plain] = [...container.querySelectorAll(".hm-file-drop-zone")];
    expect(getComputedStyle(plain as Element).display).toBe("flex");
    expect(getComputedStyle(styled as Element).borderTopStyle).toBe("dashed");
    expect(getComputedStyle(plain as Element).borderTopStyle).toBe("none");
  });

  it("forwards its ref to the zone and buttonRef to the button", () => {
    const ref = createRef<HTMLDivElement>();
    const buttonRef = createRef<HTMLButtonElement>();
    render(<FileDropZone ref={ref} buttonRef={buttonRef} onFiles={() => undefined} />);
    expect(ref.current?.classList.contains("hm-file-drop-zone")).toBe(true);
    expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("hydrates without errors or warnings, and takes drops afterwards", () => {
    const onFiles = vi.fn();
    const app = (
      <FileDropZone accept=".pdf" onFiles={onFiles}>
        <p>Open a document</p>
      </FileDropZone>
    );
    const container = mount(renderToString(app));
    const consoleError = vi.spyOn(console, "error");
    const recoverable: unknown[] = [];
    act(() => {
      root = hydrateRoot(container, app, { onRecoverableError: (e) => recoverable.push(e) });
    });
    expect(recoverable).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    const file = pdf();
    drag(container.querySelector(".hm-file-drop-zone") as Element, "drop", transfer(file));
    expect(onFiles).toHaveBeenCalledWith([file]);
  });
});
