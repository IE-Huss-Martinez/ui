import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnnouncerProvider, useAnnounce } from "./Announcer.js";

afterEach(() => {
  vi.restoreAllMocks();
});

function Announces() {
  const announce = useAnnounce();
  announce("Saved");
  return <p>Content</p>;
}

describe("AnnouncerProvider on the server", () => {
  it("renders its children and two empty, visually hidden live regions", () => {
    const html = renderToString(
      <AnnouncerProvider>
        <p>Content</p>
      </AnnouncerProvider>,
    );
    expect(html).toBe(
      '<p>Content</p><div class="hm-visually-hidden hm-announcer"><div role="status" aria-live="polite" aria-atomic="true"></div><div role="alert" aria-live="assertive" aria-atomic="true"></div></div>',
    );
  });

  it("does nothing without a provider, with a warning in development", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(() => renderToString(<Announces />)).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/useAnnounce needs an AnnouncerProvider/),
    );
  });
});
