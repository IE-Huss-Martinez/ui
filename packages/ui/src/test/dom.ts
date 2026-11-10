import stylesUrl from "../styles.css?url";

const added: Element[] = [];

/** Adds an element to the document, removed again by {@link cleanUp}. */
export function track<T extends Element>(element: T): T {
  added.push(element);
  return element;
}

/** Loads the package's styles.css through a link element. */
export async function loadStyles(): Promise<CSSStyleSheet> {
  const link = track(document.createElement("link"));
  link.rel = "stylesheet";
  link.href = stylesUrl;
  const loaded = new Promise<void>((resolve, reject) => {
    link.addEventListener("load", () => resolve(), { once: true });
    link.addEventListener("error", () => reject(new Error("styles.css failed to load")), {
      once: true,
    });
  });
  document.head.append(link);
  await loaded;
  if (!link.sheet) {
    throw new Error("styles.css loaded without a stylesheet");
  }
  return link.sheet;
}

/** Adds a style element with the given CSS. */
export function addStyle(css: string, where: "start" | "end" = "end"): HTMLStyleElement {
  const style = track(document.createElement("style"));
  style.textContent = css;
  if (where === "start") {
    document.head.prepend(style);
  } else {
    document.head.append(style);
  }
  return style;
}

/** Builds markup in a fresh container in the body. */
export function mount(html: string): HTMLElement {
  const container = track(document.createElement("div"));
  container.innerHTML = html;
  document.body.append(container);
  return container;
}

/** A token's computed value on an element. */
export function token(element: Element | null, name: string): string {
  if (!element) {
    throw new Error(`no element to read --hm-${name} from`);
  }
  return getComputedStyle(element).getPropertyValue(`--hm-${name}`).trim();
}

/** Removes everything the helpers added, and any attributes set on the root. */
export function cleanUp(): void {
  for (const element of added.splice(0)) {
    element.remove();
  }
  document.documentElement.removeAttribute("data-hm-theme");
  document.documentElement.removeAttribute("data-hm-density");
}
