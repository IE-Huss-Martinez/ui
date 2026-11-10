import type { TokenType } from "../tokens/definitions.js";

/**
 * An allowlist parser for token values. Theme values can come from users, for
 * example a brand colour typed into a settings page, and they end up in a
 * `<style>` element. So values aren't escaped: they're parsed into this small
 * tree, anything outside the grammar is rejected, and the CSS is written back
 * from the tree. Characters that could end a declaration, a rule or the
 * `<style>` element (`; { } < > \ @ !`), comments, `url()` and every other
 * function outside the list below never reach the output.
 */
export type CssNode =
  | { readonly kind: "ident"; readonly value: string }
  | { readonly kind: "number"; readonly value: number; readonly unit: string }
  | { readonly kind: "hash"; readonly value: string }
  | { readonly kind: "string"; readonly value: string }
  | { readonly kind: "comma" }
  | { readonly kind: "slash" }
  | { readonly kind: "operator"; readonly value: "+" | "-" | "*" }
  | { readonly kind: "function"; readonly name: string; readonly args: readonly CssNode[] };

/** A value that parsed, as nodes separated by whitespace at the top level. */
export interface ParsedValue {
  readonly nodes: readonly CssNode[];
  /** The value written back from the nodes. */
  readonly css: string;
}

/** Why a value was rejected, in words for developers. */
export class CssValueError extends Error {
  override readonly name = "CssValueError";
}

const MAX_LENGTH = 1000;
const MAX_DEPTH = 8;

/** Joins sets. A function, so importing this module has no side effects. */
function union(...parts: Iterable<string>[]): ReadonlySet<string> {
  return new Set(parts.flatMap((part) => [...part]));
}

const COLOR_FUNCTIONS = /* @__PURE__ */ new Set([
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "color",
  "color-mix",
  "light-dark",
]);
const MATH_FUNCTIONS = /* @__PURE__ */ new Set(["calc", "min", "max", "clamp"]);
const EASING_FUNCTIONS = /* @__PURE__ */ new Set(["cubic-bezier", "steps", "linear"]);
const FUNCTIONS = /* @__PURE__ */ union(COLOR_FUNCTIONS, MATH_FUNCTIONS, EASING_FUNCTIONS, ["var"]);

const LENGTH_UNITS = /* @__PURE__ */ new Set([
  "px",
  "rem",
  "em",
  "ch",
  "ex",
  "lh",
  "%",
  "vw",
  "vh",
  "vmin",
  "vmax",
  "cqw",
  "cqh",
  "cqi",
  "cqb",
]);
const TIME_UNITS = /* @__PURE__ */ new Set(["ms", "s"]);
const NUMBER_UNITS = /* @__PURE__ */ union(LENGTH_UNITS, TIME_UNITS, [
  "deg",
  "turn",
  "rad",
  "grad",
  "",
]);

/** Custom properties a value may reference: only the family's own. */
export const HM_PROPERTY = /^--hm-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IDENT = /^-?[A-Za-z_][A-Za-z0-9_-]*/;
const NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/;
const UNIT = /^(?:[A-Za-z]+|%)/;
const HASH = /^#[0-9A-Fa-f]+/;
const STRING_CONTENT = /^[A-Za-z0-9 _.-]*$/;

class Parser {
  private index = 0;
  private readonly input: string;

  constructor(input: string) {
    this.input = input;
  }

  parse(): CssNode[][] {
    const groups = this.sequence(0, false);
    if (this.index < this.input.length) {
      throw new CssValueError(`unexpected "${this.input.charAt(this.index)}"`);
    }
    return groups;
  }

  /**
   * Parses nodes until the end of the input, or until `)` when inside a
   * function. Returns the nodes grouped by top-level whitespace, so
   * `1px solid red` is three groups and `rgb(0 0 0)` is one.
   */
  private sequence(depth: number, inFunction: boolean): CssNode[][] {
    const groups: CssNode[][] = [];
    let current: CssNode[] = [];
    const flush = (): void => {
      if (current.length > 0) {
        groups.push(current);
        current = [];
      }
    };
    while (this.index < this.input.length) {
      const rest = this.input.slice(this.index);
      const char = rest.charAt(0);
      if (/^\s/.test(char)) {
        this.index += (/^\s+/.exec(rest)?.[0] ?? " ").length;
        flush();
        continue;
      }
      if (char === ")") {
        if (!inFunction) {
          throw new CssValueError('unbalanced ")"');
        }
        flush();
        return groups;
      }
      if (char === ",") {
        flush();
        groups.push([{ kind: "comma" }]);
        this.index += 1;
        continue;
      }
      if (char === "/") {
        if (rest.startsWith("/*")) {
          throw new CssValueError("comments aren't allowed");
        }
        flush();
        groups.push([{ kind: "slash" }]);
        this.index += 1;
        continue;
      }
      if (char === "*" || ((char === "+" || char === "-") && /^[+-]\s/.test(rest))) {
        if (!inFunction) {
          throw new CssValueError(`"${char}" is only allowed inside calc()`);
        }
        flush();
        groups.push([{ kind: "operator", value: char as "+" | "-" | "*" }]);
        this.index += 1;
        continue;
      }
      if (char === '"' || char === "'") {
        current.push(this.string(char));
        continue;
      }
      if (char === "#") {
        const hash = HASH.exec(rest)?.[0];
        if (!hash || ![4, 5, 7, 9].includes(hash.length)) {
          throw new CssValueError("hex colours have 3, 4, 6 or 8 digits");
        }
        current.push({ kind: "hash", value: hash.toLowerCase() });
        this.index += hash.length;
        continue;
      }
      const number = NUMBER.exec(rest)?.[0];
      if (number) {
        this.index += number.length;
        const unit = UNIT.exec(this.input.slice(this.index))?.[0] ?? "";
        if (!NUMBER_UNITS.has(unit.toLowerCase())) {
          throw new CssValueError(`the unit "${unit}" isn't allowed`);
        }
        this.index += unit.length;
        current.push({ kind: "number", value: Number(number), unit: unit.toLowerCase() });
        continue;
      }
      if (rest.startsWith("--")) {
        const name = /^--[A-Za-z0-9_-]*/.exec(rest)?.[0] ?? "--";
        if (!HM_PROPERTY.test(name)) {
          throw new CssValueError(`only --hm-* custom properties can be referenced, not "${name}"`);
        }
        current.push({ kind: "ident", value: name });
        this.index += name.length;
        continue;
      }
      const ident = IDENT.exec(rest)?.[0];
      if (ident) {
        this.index += ident.length;
        if (this.input.charAt(this.index) === "(") {
          current.push(this.function(ident.toLowerCase(), depth));
        } else {
          current.push({ kind: "ident", value: ident.toLowerCase() });
        }
        continue;
      }
      throw new CssValueError(`the character "${char}" isn't allowed`);
    }
    if (inFunction) {
      throw new CssValueError('unbalanced "("');
    }
    flush();
    return groups;
  }

  private function(name: string, depth: number): CssNode {
    if (!FUNCTIONS.has(name)) {
      throw new CssValueError(`the function "${name}()" isn't allowed`);
    }
    if (depth >= MAX_DEPTH) {
      throw new CssValueError("functions are nested too deeply");
    }
    this.index += 1;
    const args = this.sequence(depth + 1, true).flat();
    this.index += 1;
    if (name === "var") {
      const [property, comma] = args;
      if (property?.kind !== "ident" || !HM_PROPERTY.test(property.value)) {
        throw new CssValueError("var() must name a --hm-* custom property");
      }
      if (args.length > 1 && comma?.kind !== "comma") {
        throw new CssValueError("var() takes a property name and an optional fallback");
      }
    }
    return { kind: "function", name, args };
  }

  private string(quote: string): CssNode {
    const end = this.input.indexOf(quote, this.index + 1);
    if (end === -1) {
      throw new CssValueError("unterminated string");
    }
    const value = this.input.slice(this.index + 1, end);
    if (!STRING_CONTENT.test(value)) {
      throw new CssValueError("strings may only contain letters, digits, spaces, _ . and -");
    }
    this.index = end + 1;
    return { kind: "string", value };
  }
}

function serializeNode(node: CssNode): string {
  switch (node.kind) {
    case "ident":
      return node.value;
    case "number":
      return `${node.value}${node.unit}`;
    case "hash":
      return node.value;
    case "string":
      return `"${node.value}"`;
    case "comma":
      return ",";
    case "slash":
      return "/";
    case "operator":
      return node.value;
    case "function":
      return `${node.name}(${serializeNodes(node.args)})`;
  }
}

/** Writes nodes back as CSS, with normalised spacing. */
export function serializeNodes(nodes: readonly CssNode[]): string {
  let css = "";
  nodes.forEach((node, index) => {
    if (node.kind === "comma") {
      css += ",";
      return;
    }
    if (index > 0) {
      css += " ";
    }
    css += serializeNode(node);
  });
  return css;
}

/**
 * Parses a token value against the allowlist grammar, without checking its
 * type. Throws {@link CssValueError} when the value isn't allowed.
 */
export function parseValue(input: string): ParsedValue {
  if (typeof input !== "string") {
    throw new CssValueError("values must be strings");
  }
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new CssValueError("the value is empty");
  }
  if (trimmed.length > MAX_LENGTH) {
    throw new CssValueError(`the value is longer than ${MAX_LENGTH} characters`);
  }
  const nodes = new Parser(trimmed).parse().flat();
  return { nodes, css: serializeNodes(nodes) };
}

const isVar = (node: CssNode): boolean => node.kind === "function" && node.name === "var";
const isMath = (node: CssNode): boolean =>
  node.kind === "function" && MATH_FUNCTIONS.has(node.name);

function isColor(node: CssNode): boolean {
  if (isVar(node) || node.kind === "hash") {
    return true;
  }
  if (node.kind === "function") {
    return COLOR_FUNCTIONS.has(node.name);
  }
  return (
    node.kind === "ident" && ["transparent", "currentcolor", "black", "white"].includes(node.value)
  );
}

function isLength(node: CssNode): boolean {
  if (isVar(node) || isMath(node)) {
    return true;
  }
  return (
    node.kind === "number" &&
    (LENGTH_UNITS.has(node.unit) || (node.unit === "" && node.value === 0))
  );
}

function isPlainNumber(node: CssNode, integer = false): boolean {
  if (isVar(node) || isMath(node)) {
    return true;
  }
  return node.kind === "number" && node.unit === "" && (!integer || Number.isInteger(node.value));
}

/** Splits nodes at top-level commas. */
function splitByComma(nodes: readonly CssNode[]): CssNode[][] {
  const lists: CssNode[][] = [[]];
  for (const node of nodes) {
    if (node.kind === "comma") {
      lists.push([]);
    } else {
      lists[lists.length - 1]?.push(node);
    }
  }
  return lists;
}

const OUTLINE_STYLES = /* @__PURE__ */ new Set([
  "solid",
  "dashed",
  "dotted",
  "double",
  "auto",
  "none",
]);
const EASING_KEYWORDS = /* @__PURE__ */ new Set([
  "linear",
  "ease",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "step-start",
  "step-end",
]);

const typeCheckers: Record<TokenType, (nodes: readonly CssNode[]) => boolean> = {
  color: (nodes) => nodes.length === 1 && isColor(nodes[0] as CssNode),
  length: (nodes) => nodes.length === 1 && isLength(nodes[0] as CssNode),
  duration: (nodes) => {
    const [node] = nodes;
    return (
      nodes.length === 1 &&
      node !== undefined &&
      (isVar(node) || isMath(node) || (node.kind === "number" && TIME_UNITS.has(node.unit)))
    );
  },
  easing: (nodes) => {
    const [node] = nodes;
    if (nodes.length !== 1 || node === undefined) {
      return false;
    }
    if (node.kind === "ident") {
      return EASING_KEYWORDS.has(node.value);
    }
    return isVar(node) || (node.kind === "function" && EASING_FUNCTIONS.has(node.name));
  },
  number: (nodes) => nodes.length === 1 && isPlainNumber(nodes[0] as CssNode),
  integer: (nodes) => nodes.length === 1 && isPlainNumber(nodes[0] as CssNode, true),
  "font-weight": (nodes) => {
    const [node] = nodes;
    if (nodes.length !== 1 || node === undefined) {
      return false;
    }
    if (node.kind === "ident") {
      return node.value === "normal" || node.value === "bold";
    }
    return (
      isVar(node) ||
      (node.kind === "number" && node.unit === "" && node.value >= 1 && node.value <= 1000)
    );
  },
  "font-family": (nodes) =>
    splitByComma(nodes).every(
      (family) =>
        family.length > 0 &&
        (family.every((node) => node.kind === "ident") ||
          (family.length === 1 && (family[0]?.kind === "string" || isVar(family[0] as CssNode)))),
    ),
  shadow: (nodes) => {
    if (nodes.length === 1 && nodes[0]?.kind === "ident" && nodes[0].value === "none") {
      return true;
    }
    return splitByComma(nodes).every((layer) => {
      const lengths = layer.filter((node) => isLength(node) && !isVar(node)).length;
      const vars = layer.filter(isVar).length;
      const colors = layer.filter((node) => !isVar(node) && isColor(node)).length;
      const inset = layer.filter((node) => node.kind === "ident" && node.value === "inset").length;
      return (
        layer.length === lengths + vars + colors + inset &&
        colors <= 1 &&
        inset <= 1 &&
        (vars > 0 || (lengths >= 2 && lengths <= 4))
      );
    });
  },
  outline: (nodes) =>
    nodes.length >= 1 &&
    nodes.length <= 3 &&
    nodes.every(
      (node) =>
        isLength(node) ||
        isColor(node) ||
        (node.kind === "ident" && OUTLINE_STYLES.has(node.value)),
    ),
  "color-scheme": (nodes) =>
    nodes.length === 1 &&
    nodes[0]?.kind === "ident" &&
    (nodes[0].value === "light" || nodes[0].value === "dark"),
};

/**
 * Parses a value and checks it against a token type. Returns the CSS written
 * back from the parsed value. Throws {@link CssValueError} when the value
 * isn't allowed or doesn't fit the type.
 */
export function validateValue(input: string, type: TokenType | undefined): string {
  const parsed = parseValue(input);
  if (type && !typeCheckers[type](parsed.nodes)) {
    throw new CssValueError(`"${parsed.css}" isn't a valid ${type} value`);
  }
  return parsed.css;
}
