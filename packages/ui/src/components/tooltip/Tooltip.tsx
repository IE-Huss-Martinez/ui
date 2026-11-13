import type { ShortcutPart } from "@hussmartinez/sdk-core";
import {
  type ComponentPropsWithRef,
  cloneElement,
  type FocusEvent,
  forwardRef,
  isValidElement,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  version,
} from "react";
import { warnInDevelopment } from "../../internal/development.js";
import { usePlatform } from "../../react/use-platform.js";
import { joinIds } from "../field/field-context.js";
import { useUiMessages } from "../messages/UiMessagesProvider.js";
import { cx, type StyleProps, unstyledAttribute } from "../shared/style-props.js";

declare const process: { readonly env: { readonly NODE_ENV?: string } };

/**
 * The parts of a tooltip that `classNames` can target.
 *
 * @public
 */
export type TooltipPart = "root" | "content" | "shortcut";

/**
 * Props of {@link Tooltip}.
 *
 * @public
 */
export interface TooltipProps extends StyleProps<TooltipPart> {
  /** The text. Use text from your message catalogue. */
  readonly content: ReactNode;
  /**
   * How the text reaches assistive technology. `description`, the default,
   * describes the trigger (`aria-describedby`). `label` names it
   * (`aria-labelledby`): use it for an icon-only button whose tooltip says
   * what its label would, so screen readers don't hear it twice.
   */
  readonly type?: "description" | "label" | undefined;
  /**
   * The trigger's keyboard shortcut, as sdk-core's shortcut registry
   * describes it: `registry.describe(toolId)[0]`. The tooltip shows it in the
   * platform's notation, such as ⌘⇧Z or Ctrl+Shift+Z, and the trigger gets
   * `aria-keyshortcuts`.
   */
  readonly shortcut?: readonly ShortcutPart[] | undefined;
  /** Where it shows, when there's room: `top` (the default) or `bottom`. */
  readonly placement?: "top" | "bottom" | undefined;
  /** How long the pointer rests on the trigger before it shows, in milliseconds. Defaults to 500. */
  readonly delay?: number | undefined;
  /**
   * The trigger: one element that forwards its ref, such as `IconButton`.
   * A disabled trigger should use `focusableWhenDisabled`: a natively
   * disabled button gets neither focus nor pointer events, so its tooltip
   * can't show.
   */
  readonly children: ReactElement;
}

/** How long the pointer may take to move from the trigger onto the tooltip. */
const GRACE = 100;

/** ARIA's name for a key in `aria-keyshortcuts`, which uses `KeyboardEvent.key` names. */
const ariaKey = (part: ShortcutPart): string => (part.value === " " ? "Space" : part.value);

/** Places the tooltip next to its trigger, inside the viewport, on the side with room. */
function place(trigger: HTMLElement, tooltip: HTMLElement, preferred: "top" | "bottom"): void {
  const anchor = trigger.getBoundingClientRect();
  const box = tooltip.getBoundingClientRect();
  const viewport = document.documentElement;
  const above = anchor.top;
  const below = viewport.clientHeight - anchor.bottom;
  const fits = (side: "top" | "bottom") => (side === "top" ? above : below) >= box.height;
  const other = preferred === "top" ? "bottom" : "top";
  const side = fits(preferred) || !fits(other) ? preferred : other;
  const left = Math.min(
    Math.max(anchor.left + anchor.width / 2 - box.width / 2, 0),
    Math.max(viewport.clientWidth - box.width, 0),
  );
  // Set through the CSSOM, which a strict Content Security Policy allows.
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${side === "top" ? anchor.top - box.height : anchor.bottom}px`;
  tooltip.dataset["hmPlacement"] = side;
}

/** The trigger's own ref, where React keeps it in versions 18 and 19. */
function refOf(element: ReactElement): Ref<HTMLElement> | undefined {
  if (version.startsWith("18")) {
    return (element as { ref?: Ref<HTMLElement> }).ref;
  }
  return (element.props as { ref?: Ref<HTMLElement> }).ref;
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    (ref as { current: T | null }).current = value;
  }
}

type TriggerProps = ComponentPropsWithRef<"button">;

/**
 * A tooltip: short text about a control, shown while the pointer rests on it
 * or while it has keyboard focus (WAI-ARIA tooltip pattern, WCAG 1.4.13).
 *
 * - It shows after `delay` on hover, and at once on keyboard focus, never
 *   on a mouse click's focus or on touch.
 * - The pointer can move onto it without it closing, and it stays until the
 *   pointer and focus leave. Escape closes it without moving focus, and
 *   doesn't close a surrounding dialog.
 * - **While it's open, the first Escape belongs to the tooltip.** It calls
 *   `preventDefault()`, so an editor's own Escape action, such as cancelling
 *   a crop, runs on the second press. sdk-core's shortcut registry already
 *   skips handled events; a handler of your own should check
 *   `event.defaultPrevented` too.
 * - It's in the top layer, through the Popover API, so no stacking context
 *   can hide it, and it's placed above the trigger, or below when there's no
 *   room, without a positioning library (docs/adr/0006).
 *
 * @example
 * ```tsx
 * <Tooltip type="label" content={t("toolbar.undo")} shortcut={shortcuts.describe("pdf.undo")[0]}>
 *   <IconButton label={t("toolbar.undo")} icon={<UndoIcon />} onClick={undo} />
 * </Tooltip>
 * ```
 *
 * @public
 */
export const Tooltip = /* @__PURE__ */ forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  {
    content,
    type = "description",
    shortcut,
    placement = "top",
    delay = 500,
    className,
    classNames,
    unstyled,
    children,
  },
  ref,
) {
  const id = useId();
  const contentId = `${id}-content`;
  const platform = usePlatform();
  const messages = useUiMessages();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const tooltip = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Escape keeps it closed until the pointer or focus leaves and comes back.
  const dismissed = useRef(false);

  const clear = (): void => {
    clearTimeout(timer.current);
    timer.current = undefined;
  };
  const show = useCallback((after: number): void => {
    clearTimeout(timer.current);
    if (dismissed.current) {
      return;
    }
    timer.current = setTimeout(() => setOpen(true), after);
  }, []);
  const hide = useCallback((after: number): void => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), after);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    const element = tooltip.current;
    if (!element || typeof element.showPopover !== "function") {
      return;
    }
    if (!open) {
      if (element.matches(":popover-open")) {
        element.hidePopover();
      }
      return;
    }
    element.showPopover();
    if (trigger.current) {
      place(trigger.current, element, placement);
    }
    const close = (): void => setOpen(false);
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        // Only the tooltip closes: a surrounding dialog stays open.
        event.preventDefault();
        dismissed.current = true;
        close();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    // A moved trigger would leave the tooltip behind, so scrolling closes it.
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open, placement]);

  if (!isValidElement(children)) {
    if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
      warnInDevelopment("Tooltip needs one element as its child, such as an IconButton.");
    }
    return children;
  }

  const child = children as ReactElement<TriggerProps>;
  const own = child.props;
  const childRef = refOf(child);
  const keyshortcuts =
    shortcut && shortcut.length > 0 ? shortcut.map(ariaKey).join("+") : own["aria-keyshortcuts"];
  // Every catalogue includes sdkCoreMessages (sdk-core ADR 0019), which has
  // the keys.* messages a shortcut's parts name.
  const text = messages.t as unknown as (key: string) => string;

  const triggerProps: Partial<TriggerProps> = {
    ref: (node: HTMLButtonElement | null) => {
      trigger.current = node;
      setRef(childRef, node);
    },
    ...(type === "label"
      ? { "aria-labelledby": joinIds(contentId, own["aria-labelledby"]) }
      : { "aria-describedby": joinIds(own["aria-describedby"], contentId) }),
    "aria-keyshortcuts": keyshortcuts,
    onPointerEnter: (event: PointerEvent<HTMLButtonElement>) => {
      own.onPointerEnter?.(event);
      if (event.pointerType !== "touch") {
        show(open ? 0 : delay);
      }
    },
    onPointerLeave: (event: PointerEvent<HTMLButtonElement>) => {
      own.onPointerLeave?.(event);
      dismissed.current = false;
      hide(GRACE);
    },
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      own.onPointerDown?.(event);
      clear();
      setOpen(false);
    },
    onFocus: (event: FocusEvent<HTMLButtonElement>) => {
      own.onFocus?.(event);
      // Keyboard focus only: a click's focus would show it under the pointer.
      // At once, without a timer.
      if (event.currentTarget.matches(":focus-visible") && !dismissed.current) {
        clear();
        setOpen(true);
      }
    },
    onBlur: (event: FocusEvent<HTMLButtonElement>) => {
      own.onBlur?.(event);
      dismissed.current = false;
      clear();
      setOpen(false);
    },
  };

  return (
    <>
      {cloneElement(child, triggerProps)}
      <div
        ref={(node) => {
          tooltip.current = node;
          setRef(ref, node);
        }}
        id={id}
        role="tooltip"
        popover="manual"
        className={cx("hm-tooltip", classNames?.root, className)}
        data-hm-unstyled={unstyledAttribute(unstyled)}
        // Hoverable (WCAG 1.4.13): moving onto the tooltip keeps it open.
        onPointerEnter={() => clear()}
        onPointerLeave={() => hide(GRACE)}
      >
        <span id={contentId} className={cx("hm-tooltip-content", classNames?.content)}>
          {content}
        </span>
        {shortcut && shortcut.length > 0 ? (
          // Assistive technology gets it from aria-keyshortcuts on the trigger.
          <span className={cx("hm-tooltip-shortcut", classNames?.shortcut)} aria-hidden="true">
            {shortcut.map((part, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a chord's parts are static and ordered
              <span key={index}>
                {index > 0 && platform === "other" ? "+" : null}
                <kbd>{part.message ? text(part.message) : part.value}</kbd>
              </span>
            ))}
          </span>
        ) : null}
      </div>
    </>
  );
});
