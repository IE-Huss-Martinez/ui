import { createMessages, defineMessages, sdkCoreMessages } from "@hussmartinez/sdk-core";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { uiMessages } from "../../messages/en.js";
import { UiMessagesProvider } from "../messages/UiMessagesProvider.js";
import { accepts, check, FileDropZone } from "./FileDropZone.js";

const file = (name: string, type = "") => new File(["x"], name, { type });

describe("FileDropZone's checks", () => {
  it("matches accept by extension, MIME type or wildcard, ignoring case", () => {
    expect(accepts(file("Report.PDF"), ".pdf")).toBe(true);
    expect(accepts(file("report", "application/pdf"), "application/pdf")).toBe(true);
    expect(accepts(file("song.flac", "audio/flac"), "audio/*")).toBe(true);
    expect(accepts(file("song.flac", "audio/flac"), ".pdf, audio/*")).toBe(true);
    expect(accepts(file("notes.txt", "text/plain"), ".pdf,application/pdf")).toBe(false);
    // ".pdf" is a suffix of the name, not a substring.
    expect(accepts(file("report.pdf.exe"), ".pdf")).toBe(false);
    expect(accepts(file("anything"), undefined)).toBe(true);
    expect(accepts(file("anything"), " , ")).toBe(true);
  });

  it("turns away other types, extra files and folders, with a reason each", () => {
    const pdf = file("a.pdf");
    const txt = file("b.txt");
    expect(check([pdf, txt], new Set(), ".pdf", true)).toEqual({
      accepted: [pdf],
      rejected: [{ file: txt, reason: "type" }],
    });
    const second = file("c.pdf");
    expect(check([pdf, second], new Set(), ".pdf", false)).toEqual({
      accepted: [],
      rejected: [
        { file: pdf, reason: "count" },
        { file: second, reason: "count" },
      ],
    });
    const folder = file("Scans");
    expect(check([folder], new Set([0]), undefined, false)).toEqual({
      accepted: [],
      rejected: [{ file: folder, reason: "directory" }],
    });
  });
});

describe("FileDropZone on the server", () => {
  it("renders a zone, a button described by the hint, and a hidden file input", () => {
    const html = renderToString(<FileDropZone accept=".pdf" onFiles={() => undefined} />);
    expect(html).toMatch(/^<div class="hm-file-drop-zone">/);
    const hintId = /<div id="([^"]+)" class="hm-file-drop-zone-hint">or drop it here<\/div>/.exec(
      html,
    )?.[1];
    expect(hintId).toBeTruthy();
    expect(html).toContain(`aria-describedby="${hintId}"`);
    expect(html).toContain('class="hm-button hm-button--primary hm-file-drop-zone-button"');
    expect(html).toContain('<span class="hm-button-label">Choose a file</span>');
    expect(html).toMatch(
      /<input type="file" accept=".pdf" tabindex="-1" aria-hidden="true" hidden=""\/>/i,
    );
    expect(html).not.toContain("data-hm-dragging");
  });

  it("says files, and takes several, with multiple", () => {
    const html = renderToString(<FileDropZone multiple onFiles={() => undefined} />);
    expect(html).toContain("Choose files");
    expect(html).toContain("or drop them here");
    expect(html).toMatch(/<input type="file" multiple=""/);
  });

  it("takes its text from props first, then the messages", () => {
    const messages = createMessages(defineMessages({ ...sdkCoreMessages, ...uiMessages }), {
      overrides: {
        "fileDropZone.choose": "Datei auswählen",
        "fileDropZone.hint": "oder hier ablegen",
      },
    });
    const translated = renderToString(
      <UiMessagesProvider messages={messages}>
        <FileDropZone onFiles={() => undefined} />
      </UiMessagesProvider>,
    );
    expect(translated).toContain("Datei auswählen");
    expect(translated).toContain("oder hier ablegen");
    const own = renderToString(
      <FileDropZone buttonLabel="Open a PDF" hint="Up to 100 MB" onFiles={() => undefined} />,
    );
    expect(own).toContain("Open a PDF");
    expect(own).toContain("Up to 100 MB");
  });

  it("renders its children before the button", () => {
    const html = renderToString(
      <FileDropZone onFiles={() => undefined}>
        <p>Open a document</p>
      </FileDropZone>,
    );
    expect(html.indexOf("Open a document")).toBeLessThan(html.indexOf("hm-file-drop-zone-button"));
  });

  it("disables the button and the input, and marks the zone", () => {
    const html = renderToString(<FileDropZone disabled onFiles={() => undefined} />);
    expect(html).toContain('data-hm-disabled=""');
    expect(html).toMatch(/<button[^>]* disabled=""/);
    expect(html).toMatch(/<input type="file"[^>]* disabled=""/);
  });

  it("adds className and classNames per part, and marks unstyled", () => {
    const html = renderToString(
      <FileDropZone
        className="app"
        classNames={{ root: "root", button: "button", hint: "hint" }}
        unstyled
        onFiles={() => undefined}
      />,
    );
    expect(html).toContain('class="hm-file-drop-zone root app"');
    expect(html).toContain('data-hm-unstyled=""');
    expect(html).toMatch(
      /class="hm-button hm-button--primary hm-file-drop-zone-button button"[^>]* data-hm-unstyled=""/,
    );
    expect(html).toContain('class="hm-file-drop-zone-hint hint"');
  });
});
