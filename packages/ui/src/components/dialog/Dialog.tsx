import {
  type DialogHTMLAttributes,
  type ForwardedRef,
  forwardRef,
  type ReactElement,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
} from "react";
import { IconButton } from "../button/IconButton.js";
import { useUiText } from "../messages/UiMessagesProvider.js";
import { cx, type StyleProps, unstyledAttribute } from "../shared/style-props.js";
import { CloseIcon } from "./CloseIcon.js";

/**
 * The parts of a dialog that `classNames` can target.
 *
 * @public
 */
export type DialogPart = "root" | "header" | "title" | "description" | "body" | "footer" | "close";

/**
 * Props of {@link Dialog}.
 *
 * @public
 */
export interface DialogProps
  extends Omit<DialogHTMLAttributes<HTMLDialogElement>, "className" | "title" | "open">,
    StyleProps<DialogPart> {
  /** Whether the dialog is open. The dialog is always controlled. */
  readonly open: boolean;
  /**
   * Called with `false` when the user asks to close: Escape, or the close
   * button. Keep `open` true to refuse, for example while saving.
   */
  readonly onOpenChange: (open: boolean) => void;
  /** The heading, and the dialog's accessible name. */
  readonly title: ReactNode;
  /** A short description under the title, read when the dialog opens. */
  readonly description?: ReactNode;
  /** Actions at the bottom, such as Cancel and Save buttons. */
  readonly footer?: ReactNode;
  /** The close button's accessible name. Defaults to `dialog.close` from the messages. */
  readonly closeLabel?: string | undefined;
  /** Replaces the close icon. It draws with `currentColor`. */
  readonly closeIcon?: ReactNode;
  /** The element to focus when the dialog opens. Defaults to the first focusable one. */
  readonly initialFocus?: RefObject<HTMLElement | null> | undefined;
  /** Defaults to `medium`. */
  readonly size?: "small" | "medium" | "large" | undefined;
}

function useMergedRef<T>(forwarded: ForwardedRef<T>) {
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
 * A modal dialog on the native `<dialog>` element with `showModal()` (ADR
 * 0014): it traps focus, makes the page behind it inert, and sits in the top
 * layer, which host z-indexes and overflow can't break.
 *
 * - **Controlled:** `open` decides, and `onOpenChange(false)` asks to close,
 *   on Escape or the close button.
 * - **Focus:** moves into the dialog when it opens, to `initialFocus` or the
 *   first focusable element, and back to what was focused before when it
 *   closes.
 * - **Server rendering:** renders closed, and opens after hydration.
 *
 * @example
 * ```tsx
 * <Dialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title={messages.t("export.title")}
 *   footer={<Button variant="primary" onClick={exportFile}>{messages.t("export.confirm")}</Button>}
 * >
 *   {options}
 * </Dialog>
 * ```
 *
 * @public
 */
export const Dialog = /* @__PURE__ */ forwardRef(function Dialog(
  {
    open,
    onOpenChange,
    title,
    description,
    footer,
    closeLabel,
    closeIcon,
    initialFocus,
    size = "medium",
    className,
    classNames,
    unstyled,
    children,
    onCancel,
    onClose,
    ...props
  }: DialogProps,
  forwardedRef: ForwardedRef<HTMLDialogElement>,
): ReactElement {
  const defaultCloseLabel = useUiText("dialog.close");
  const [ref, setRef] = useMergedRef(forwardedRef);
  const body = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      // Closing a dialog opened with showModal() returns focus to the element
      // that was focused before, in every supported browser.
      dialog.showModal();
      initialFocus?.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialFocus, ref]);

  // A body that scrolls must be reachable by keyboard, or content without
  // focusable elements can't be scrolled (axe: scrollable-region-focusable).
  // It's a Tab stop only while it overflows, so short dialogs don't get one.
  useEffect(() => {
    const element = body.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }
    const update = (): void => {
      if (element.scrollHeight > element.clientHeight) {
        element.tabIndex = 0;
      } else {
        element.removeAttribute("tabindex");
      }
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    for (const child of element.children) {
      observer.observe(child);
    }
    update();
    return () => observer.disconnect();
  }, []);

  // Escape fires cancel. The dialog only closes when `open` becomes false.
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>): void => {
    onCancel?.(event);
    event.preventDefault();
    onOpenChange(false);
  };

  // Browsers may close a dialog without a cancellable cancel event, such as
  // on a second Escape without user activation; report it like any close.
  const handleClose = (event: SyntheticEvent<HTMLDialogElement>): void => {
    onClose?.(event);
    if (open) {
      onOpenChange(false);
    }
  };

  return (
    <dialog
      {...props}
      ref={setRef}
      aria-labelledby={titleId}
      aria-describedby={description == null ? undefined : descriptionId}
      className={cx(
        "hm-dialog",
        size !== "medium" && `hm-dialog--${size}`,
        classNames?.root,
        className,
      )}
      data-hm-unstyled={unstyledAttribute(unstyled)}
      onCancel={handleCancel}
      onClose={handleClose}
    >
      <div className={cx("hm-dialog-header", classNames?.header)}>
        <h2 id={titleId} className={cx("hm-dialog-title", classNames?.title)}>
          {title}
        </h2>
        <IconButton
          variant="quiet"
          size="small"
          label={closeLabel ?? defaultCloseLabel}
          icon={closeIcon ?? <CloseIcon />}
          className={cx("hm-dialog-close", classNames?.close)}
          unstyled={unstyled}
          onClick={() => onOpenChange(false)}
        />
      </div>
      {description == null ? null : (
        <p id={descriptionId} className={cx("hm-dialog-description", classNames?.description)}>
          {description}
        </p>
      )}
      <div ref={body} className={cx("hm-dialog-body", classNames?.body)}>
        {children}
      </div>
      {footer == null ? null : (
        <div className={cx("hm-dialog-footer", classNames?.footer)}>{footer}</div>
      )}
    </dialog>
  );
});
