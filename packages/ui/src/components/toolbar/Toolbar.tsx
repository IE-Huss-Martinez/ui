import {
  type FocusEvent,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { cx, type StyleProps, unstyledAttribute } from "../shared/style-props.js";
import { moveFocus, syncTabStop } from "./roving-focus.js";
import { ToolbarContext } from "./toolbar-context.js";

/**
 * Props of {@link Toolbar}.
 *
 * @public
 */
export interface ToolbarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "className" | "role">,
    StyleProps<"root"> {
  /** The toolbar's accessible name, such as "Page tools". Required. */
  readonly label: string;
  /** Defaults to `horizontal`. Arrow keys follow it. */
  readonly orientation?: "horizontal" | "vertical" | undefined;
}

function useMergedRef<T>(forwarded: React.ForwardedRef<T>) {
  const local = useRef<T | null>(null);
  const setRef = useCallback(
    (node: T | null) => {
      local.current = node;
      if (typeof forwarded === "function") {
        forwarded(node);
      } else if (forwarded) {
        forwarded.current = node;
      }
    },
    [forwarded],
  );
  return [local, setRef] as const;
}

/**
 * A toolbar (WAI-ARIA `toolbar`): one Tab stop, arrow keys between its items,
 * Home and End to the ends. Items are any focusable descendants, such as
 * `Button`, `IconButton` and `SegmentedControl`. Disabled items that should
 * stay discoverable use `focusableWhenDisabled`.
 *
 * @example
 * ```tsx
 * <Toolbar label={messages.t("toolbar.label")}>
 *   <ToolbarGroup label={messages.t("toolbar.history")}>
 *     <IconButton label={messages.t("toolbar.undo")} icon={<UndoIcon />} />
 *   </ToolbarGroup>
 *   <ToolbarSeparator />
 * </Toolbar>
 * ```
 *
 * @public
 */
export const Toolbar = /* @__PURE__ */ forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  {
    label,
    orientation = "horizontal",
    className,
    classNames,
    unstyled,
    onKeyDown,
    onFocus,
    children,
    ...props
  },
  forwardedRef,
): ReactElement {
  const [ref, setRef] = useMergedRef(forwardedRef);

  // After hydration, and whenever items change, keep exactly one Tab stop.
  useEffect(() => {
    const toolbar = ref.current;
    if (!toolbar) {
      return;
    }
    syncTabStop(toolbar);
    const observer = new MutationObserver(() => syncTabStop(toolbar, document.activeElement));
    observer.observe(toolbar, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "hidden"],
    });
    return () => observer.disconnect();
  }, [ref]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    onKeyDown?.(event);
    if (!event.defaultPrevented && ref.current && moveFocus(ref.current, event, orientation)) {
      event.preventDefault();
    }
  };

  // Clicking or programmatically focusing an item makes it the Tab stop.
  const handleFocus = (event: FocusEvent<HTMLDivElement>): void => {
    onFocus?.(event);
    if (ref.current && event.target !== ref.current) {
      syncTabStop(ref.current, event.target);
    }
  };

  return (
    <ToolbarContext.Provider value={{ orientation }}>
      <div
        {...props}
        ref={setRef}
        role="toolbar"
        aria-label={label}
        aria-orientation={orientation}
        className={cx(
          "hm-toolbar",
          orientation === "vertical" && "hm-toolbar--vertical",
          classNames?.root,
          className,
        )}
        data-hm-unstyled={unstyledAttribute(unstyled)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
      >
        {children}
      </div>
    </ToolbarContext.Provider>
  );
});
