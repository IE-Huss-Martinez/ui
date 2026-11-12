import {
  type ChangeEvent,
  type DragEvent,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Button, type ButtonVariant } from "../button/Button.js";
import { useUiText } from "../messages/UiMessagesProvider.js";
import { cx, type StyleProps, unstyledAttribute } from "../shared/style-props.js";

/**
 * The parts of a file drop zone that `classNames` can target.
 *
 * @public
 */
export type FileDropZonePart = "root" | "button" | "hint";

/**
 * A file that {@link FileDropZone} turned away, and why: `type` when it
 * doesn't match `accept`, `count` when several came and `multiple` is off,
 * `directory` for a dropped folder.
 *
 * @public
 */
export interface FileRejection {
  readonly file: File;
  readonly reason: "type" | "count" | "directory";
}

/**
 * Props of {@link FileDropZone}. Native `div` props are passed through to the
 * zone.
 *
 * @public
 */
export interface FileDropZoneProps
  extends Omit<
      HTMLAttributes<HTMLDivElement>,
      "className" | "onDrop" | "onDragEnter" | "onDragOver" | "onDragLeave"
    >,
    StyleProps<FileDropZonePart> {
  /**
   * Called with the files that passed the zone's checks, chosen or dropped,
   * in order. The checks only look at names, types and counts: validate each
   * file's contents before using it.
   */
  readonly onFiles: (files: File[]) => void;
  /** Called with the files the zone turned away, and why. */
  readonly onFilesRejected?: ((rejections: FileRejection[]) => void) | undefined;
  /**
   * The file types to offer and take, as in `<input accept>`: extensions
   * such as `.pdf`, MIME types such as `application/pdf`, or `audio/*`.
   * A hint for the picker and a first filter, not a security check: a
   * file's name and type are whatever its sender chose.
   */
  readonly accept?: string | undefined;
  /** Takes several files at once. Defaults to `false`. */
  readonly multiple?: boolean | undefined;
  /**
   * Turns away files dropped anywhere else on the page while the zone is
   * mounted, so a near miss doesn't open the file in place of the page.
   * Defaults to `true`. Turn it off when the host handles stray drops
   * itself, or embeds the zone in a page whose drag and drop it doesn't own.
   */
  readonly preventStrayDrops?: boolean | undefined;
  /** Turns the button off, and ignores drops. */
  readonly disabled?: boolean | undefined;
  /**
   * The button's text. Defaults to `fileDropZone.choose` from the messages
   * ("Choose a file"), or `fileDropZone.chooseMultiple` with `multiple`.
   */
  readonly buttonLabel?: ReactNode;
  /** Defaults to `primary`. */
  readonly buttonVariant?: ButtonVariant | undefined;
  /** A ref to the button, for moving focus to it. */
  readonly buttonRef?: Ref<HTMLButtonElement> | undefined;
  /**
   * Text under the button, which also describes it. Defaults to
   * `fileDropZone.hint` ("or drop it here"), or `fileDropZone.hintMultiple`.
   */
  readonly hint?: ReactNode;
  /** Content above the button, such as a title or the reason the last file failed. */
  readonly children?: ReactNode;
}

const hasFiles = (event: { dataTransfer: DataTransfer | null }): boolean =>
  event.dataTransfer?.types.includes("Files") ?? false;

/** Whether a file matches an `accept` list, by its name and type only. */
export function accepts(file: File, accept: string | undefined): boolean {
  const tokens = (accept ?? "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) {
    return true;
  }
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) =>
    token.startsWith(".")
      ? name.endsWith(token)
      : token.endsWith("/*")
        ? type.startsWith(token.slice(0, -1))
        : type === token,
  );
}

/** Splits files into those that pass the zone's checks and those that don't. */
export function check(
  files: readonly File[],
  directories: ReadonlySet<number>,
  accept: string | undefined,
  multiple: boolean,
): { accepted: File[]; rejected: FileRejection[] } {
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];
  files.forEach((file, index) => {
    if (directories.has(index)) {
      rejected.push({ file, reason: "directory" });
    } else if (!multiple && files.length > 1) {
      rejected.push({ file, reason: "count" });
    } else if (!accepts(file, accept)) {
      rejected.push({ file, reason: "type" });
    } else {
      accepted.push(file);
    }
  });
  return { accepted, rejected };
}

/**
 * Turns away a file dragged anywhere outside a drop zone, unless something
 * else took it, so a missed drop doesn't open the file in place of the page.
 */
function refuseStrayDrop(event: globalThis.DragEvent): void {
  if (event.defaultPrevented || !hasFiles(event)) {
    return;
  }
  event.preventDefault();
  if (event.dataTransfer && event.type === "dragover") {
    event.dataTransfer.dropEffect = "none";
  }
}

/**
 * Where people choose or drop files, such as a document to open. The button
 * opens the system's file picker: it's the keyboard and screen reader path.
 * The zone around it takes dropped files, a shortcut for pointer users, so it
 * isn't focusable itself. While files are dragged over it, it has the
 * `data-hm-dragging` attribute.
 *
 * The zone checks names, types and counts against `accept` and `multiple`,
 * and turns away folders, then calls `onFiles`. It never reads a file and
 * never shows a file's name. Treat files as untrusted: check their contents
 * before using them, and show their names as text.
 *
 * While a zone is on the page, files dropped elsewhere on the page are
 * turned away, so a near miss doesn't navigate away from it. Hosts that
 * handle that themselves turn it off with `preventStrayDrops={false}`.
 *
 * @example
 * ```tsx
 * <FileDropZone accept=".pdf,application/pdf" onFiles={([file]) => open(file)}>
 *   <p>{messages.t("editor.start.title")}</p>
 * </FileDropZone>
 * ```
 *
 * @public
 */
export const FileDropZone = /* @__PURE__ */ forwardRef<HTMLDivElement, FileDropZoneProps>(
  function FileDropZone(
    {
      onFiles,
      onFilesRejected,
      accept,
      multiple = false,
      disabled = false,
      preventStrayDrops = true,
      buttonLabel,
      buttonVariant = "primary",
      buttonRef,
      hint,
      className,
      classNames,
      unstyled,
      children,
      ...props
    },
    ref,
  ) {
    const input = useRef<HTMLInputElement>(null);
    // Elements the drag has entered and not yet left. Entering a child fires
    // dragleave on its parent, so the zone only stops being a target when
    // this is empty: no flicker over children.
    const entered = useRef(new Set<EventTarget>());
    const [dragging, setDragging] = useState(false);
    const hintId = useId();
    const defaultLabel = useUiText(
      multiple ? "fileDropZone.chooseMultiple" : "fileDropZone.choose",
    );
    const defaultHint = useUiText(multiple ? "fileDropZone.hintMultiple" : "fileDropZone.hint");

    useEffect(() => {
      if (!preventStrayDrops) {
        return;
      }
      window.addEventListener("dragover", refuseStrayDrop);
      window.addEventListener("drop", refuseStrayDrop);
      return () => {
        window.removeEventListener("dragover", refuseStrayDrop);
        window.removeEventListener("drop", refuseStrayDrop);
      };
    }, [preventStrayDrops]);

    useEffect(() => {
      if (disabled) {
        entered.current.clear();
        setDragging(false);
      }
    }, [disabled]);

    const deliver = (files: readonly File[], directories: ReadonlySet<number> = new Set()) => {
      const { accepted, rejected } = check(files, directories, accept, multiple);
      if (accepted.length > 0) {
        onFiles(accepted);
      }
      if (rejected.length > 0) {
        onFilesRejected?.(rejected);
      }
    };

    const choose = (event: ChangeEvent<HTMLInputElement>): void => {
      const files = [...(event.currentTarget.files ?? [])];
      // Cleared, so choosing the same file again still delivers it.
      event.currentTarget.value = "";
      deliver(files);
    };

    const handleDragEnter = (event: DragEvent<HTMLDivElement>): void => {
      if (!hasFiles(event)) {
        return;
      }
      event.preventDefault();
      if (disabled) {
        return;
      }
      entered.current.add(event.target);
      setDragging(true);
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
      if (!hasFiles(event)) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = disabled ? "none" : "copy";
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>): void => {
      if (!hasFiles(event)) {
        return;
      }
      const zone = event.currentTarget;
      entered.current.delete(event.target);
      // Drop elements that left the zone or the page while the drag was on.
      for (const target of entered.current) {
        if (!(target instanceof Node) || !zone.contains(target)) {
          entered.current.delete(target);
        }
      }
      if (entered.current.size === 0) {
        setDragging(false);
      }
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
      if (!hasFiles(event)) {
        return;
      }
      event.preventDefault();
      entered.current.clear();
      setDragging(false);
      if (disabled) {
        return;
      }
      const files = [...event.dataTransfer.files];
      // Folders arrive as files; their entries tell them apart, without
      // reading anything. Only available during the drop event.
      const directories = new Set<number>();
      [...event.dataTransfer.items]
        .filter((item) => item.kind === "file")
        .forEach((item, index) => {
          if (item.webkitGetAsEntry?.()?.isDirectory) {
            directories.add(index);
          }
        });
      deliver(files, directories);
    };

    return (
      // The zone is a pointer shortcut only: the button opens the same picker.
      // biome-ignore lint/a11y/noStaticElementInteractions: a drop target has no keyboard role; the button is the accessible path
      <div
        {...props}
        ref={ref}
        className={cx("hm-file-drop-zone", classNames?.root, className)}
        data-hm-unstyled={unstyledAttribute(unstyled)}
        data-hm-dragging={dragging ? "" : undefined}
        data-hm-disabled={disabled ? "" : undefined}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {children}
        <Button
          ref={buttonRef}
          variant={buttonVariant}
          className={cx("hm-file-drop-zone-button", classNames?.button)}
          unstyled={unstyled}
          disabled={disabled}
          aria-describedby={hintId}
          onClick={() => input.current?.click()}
        >
          {buttonLabel ?? defaultLabel}
        </Button>
        <div id={hintId} className={cx("hm-file-drop-zone-hint", classNames?.hint)}>
          {hint ?? defaultHint}
        </div>
        <input
          ref={input}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          // The button is the control; this input only opens the picker.
          tabIndex={-1}
          aria-hidden="true"
          hidden
          onChange={choose}
        />
      </div>
    );
  },
);
