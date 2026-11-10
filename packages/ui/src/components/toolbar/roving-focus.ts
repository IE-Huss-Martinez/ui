/**
 * Roving tabindex for toolbars (WAI-ARIA APG): one Tab stop, and arrow keys
 * between items. Items are found from the DOM when needed, so they don't have
 * to register, and the server renders no tabindex at all, so hydration never
 * mismatches.
 */

// A literal, not a joined array: a call at module scope would make bundlers
// keep this module in applications that never use a toolbar.
const FOCUSABLE =
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex^="-"]):not(button, a, input, select, textarea)';

/** The toolbar's items, in DOM order, skipping hidden ones. */
export function items(toolbar: HTMLElement): HTMLElement[] {
  return [...toolbar.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) => !element.closest("[hidden], [inert]") && element.getClientRects().length > 0,
  );
}

/** Makes `active` the single Tab stop, or the first item when it's not an item. */
export function syncTabStop(toolbar: HTMLElement, active?: Element | null): void {
  const list = items(toolbar);
  const current =
    list.find((item) => item === active) ??
    list.find((item) => item.tabIndex === 0 && item.dataset["hmTabStop"] !== undefined) ??
    list[0];
  for (const item of list) {
    const isStop = item === current;
    item.tabIndex = isStop ? 0 : -1;
    if (isStop) {
      item.dataset["hmTabStop"] = "";
    } else {
      delete item.dataset["hmTabStop"];
    }
  }
}

/** Keys that never move focus inside text fields, where they edit text. */
function editsText(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.isContentEditable ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLInputElement &&
      !["button", "checkbox", "radio", "reset", "submit"].includes(target.type))
  );
}

/**
 * Moves focus for an arrow, Home or End key. Returns whether it handled the
 * key, so the caller can prevent the default.
 */
export function moveFocus(
  toolbar: HTMLElement,
  event: { key: string; target: EventTarget | null },
  orientation: "horizontal" | "vertical",
): boolean {
  if (editsText(event.target)) {
    return false;
  }
  const rtl = getComputedStyle(toolbar).direction === "rtl";
  const next = orientation === "vertical" ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
  const previous = orientation === "vertical" ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
  const list = items(toolbar);
  if (list.length === 0) {
    return false;
  }
  const index = list.indexOf(event.target as HTMLElement);
  let target: HTMLElement | undefined;
  switch (event.key) {
    case next:
      target = list[(index + 1) % list.length];
      break;
    case previous:
      target = list[(index - 1 + list.length) % list.length];
      break;
    case "Home":
      target = list[0];
      break;
    case "End":
      target = list[list.length - 1];
      break;
    default:
      return false;
  }
  if (target) {
    syncTabStop(toolbar, target);
    target.focus();
  }
  return true;
}
