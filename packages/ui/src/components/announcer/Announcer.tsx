import {
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { warnInDevelopment } from "../../internal/development.js";

/**
 * How urgently a message interrupts: `polite` waits for the screen reader to
 * finish, `assertive` interrupts. Use `assertive` only for errors the user
 * must act on.
 *
 * @public
 */
export type Politeness = "polite" | "assertive";

/**
 * Announces a message to screen readers, such as "Saved 1.3 MB" (ADR 0014).
 * The message is plain text from your message catalogue.
 *
 * @public
 */
export type Announce = (message: string, options?: { politeness?: Politeness }) => void;

const AnnouncerContext = /* @__PURE__ */ createContext<Announce | undefined>(undefined);

/**
 * Props of {@link AnnouncerProvider}.
 *
 * @public
 */
export interface AnnouncerProviderProps {
  readonly children?: ReactNode;
}

/** One live region's text, and a counter so the same message is announced again. */
interface Region {
  readonly message: string;
  readonly count: number;
}

/**
 * Renders a polite and an assertive `aria-live` region, visually hidden, and
 * lets everything inside announce through {@link useAnnounce}. The regions are
 * in the server-rendered page from the start, as screen readers only announce
 * changes to regions that already exist. Render it once, near the root of an
 * editor or application.
 *
 * @public
 */
export function AnnouncerProvider({ children }: AnnouncerProviderProps): ReactElement {
  const [polite, setPolite] = useState<Region>({ message: "", count: 0 });
  const [assertive, setAssertive] = useState<Region>({ message: "", count: 0 });
  // One pending frame per region, so announcing in one region never cancels
  // the other's message.
  const frames = useRef<Partial<Record<Politeness, number>>>({});

  useEffect(
    () => () => {
      for (const frame of Object.values(frames.current)) {
        cancelAnimationFrame(frame);
      }
    },
    [],
  );

  const announce = useCallback<Announce>((message, options) => {
    const politeness = options?.politeness ?? "polite";
    const set = politeness === "assertive" ? setAssertive : setPolite;
    // Empty the region first, then fill it on the next frame, so a message
    // that repeats the previous one is still a change, and announced again.
    set((region) => ({ message: "", count: region.count }));
    // At most one frame is pending per region, so unmounting can cancel it.
    const pending = frames.current[politeness];
    if (pending !== undefined) {
      cancelAnimationFrame(pending);
    }
    frames.current[politeness] = requestAnimationFrame(() => {
      delete frames.current[politeness];
      set((region) => ({ message, count: region.count + 1 }));
    });
  }, []);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <div className="hm-visually-hidden hm-announcer">
        <div role="status" aria-live="polite" aria-atomic="true">
          {polite.message}
        </div>
        <div role="alert" aria-live="assertive" aria-atomic="true">
          {assertive.message}
        </div>
      </div>
    </AnnouncerContext.Provider>
  );
}

function missingProvider(): void {
  warnInDevelopment(
    "useAnnounce needs an AnnouncerProvider above it; the message wasn't announced.",
  );
}

/**
 * The `announce` function of the closest {@link AnnouncerProvider}. Without
 * one, announcing does nothing and warns in development.
 *
 * @example
 * ```tsx
 * const announce = useAnnounce();
 * announce(messages.t("result.saved", { size }));
 * ```
 *
 * @public
 */
export function useAnnounce(): Announce {
  return useContext(AnnouncerContext) ?? missingProvider;
}
