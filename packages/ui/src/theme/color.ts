import { type CssNode, parseValue } from "./css-value.js";

/** A colour in sRGB, with channels and alpha from 0 to 1. */
export interface Rgba {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly alpha: number;
}

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

/** Reads a number or percentage argument; `scale` is what 100% means. */
function channel(node: CssNode | undefined, scale: number): number | undefined {
  if (node?.kind !== "number") {
    return undefined;
  }
  if (node.unit === "%") {
    return (node.value / 100) * scale;
  }
  return node.unit === "" ? node.value : undefined;
}

function hue(node: CssNode | undefined): number | undefined {
  if (node?.kind !== "number") {
    return undefined;
  }
  switch (node.unit) {
    case "":
    case "deg":
      return node.value;
    case "turn":
      return node.value * 360;
    case "rad":
      return (node.value * 180) / Math.PI;
    case "grad":
      return node.value * 0.9;
    default:
      return undefined;
  }
}

/** Splits `rgb(1 2 3 / 0.5)` or `rgb(1, 2, 3, 0.5)` into channels and alpha. */
function functionArguments(args: readonly CssNode[]): {
  channels: CssNode[];
  alpha: number | undefined;
} {
  const values = args.filter((node) => node.kind !== "comma");
  const slash = values.findIndex((node) => node.kind === "slash");
  const channels = slash === -1 ? values.slice(0, 3) : values.slice(0, slash);
  const alphaNode = slash === -1 ? values[3] : values[slash + 1];
  return { channels, alpha: alphaNode ? channel(alphaNode, 1) : 1 };
}

function fromHex(hex: string): Rgba {
  const digits = hex.slice(1);
  const full = digits.length <= 4 ? [...digits].map((digit) => digit + digit).join("") : digits;
  const byte = (index: number): number => Number.parseInt(full.slice(index, index + 2), 16) / 255;
  return { r: byte(0), g: byte(2), b: byte(4), alpha: full.length === 8 ? byte(6) : 1 };
}

function fromHsl(h: number, s: number, l: number, alpha: number): Rgba {
  const f = (n: number): number => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { r: f(0), g: f(8), b: f(4), alpha };
}

const toGamma = (linear: number): number =>
  linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
const toLinear = (gamma: number): number =>
  gamma <= 0.04045 ? gamma / 12.92 : ((gamma + 0.055) / 1.055) ** 2.4;

/** OKLab to sRGB, clipped to the sRGB gamut. */
function fromOklab(l: number, a: number, b: number, alpha: number): Rgba {
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return {
    r: toGamma(clamp(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_)),
    g: toGamma(clamp(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_)),
    b: toGamma(clamp(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_)),
    alpha,
  };
}

function fromFunction(name: string, args: readonly CssNode[]): Rgba | undefined {
  const { channels, alpha } = functionArguments(args);
  if (alpha === undefined || channels.length !== 3) {
    return undefined;
  }
  const [first, second, third] = channels;
  switch (name) {
    case "rgb":
    case "rgba": {
      const [r, g, b] = [first, second, third].map((node) => channel(node, 255));
      if (r === undefined || g === undefined || b === undefined) {
        return undefined;
      }
      return { r: clamp(r / 255), g: clamp(g / 255), b: clamp(b / 255), alpha: clamp(alpha) };
    }
    case "hsl":
    case "hsla": {
      const h = hue(first);
      const s = channel(second, 100);
      const l = channel(third, 100);
      if (h === undefined || s === undefined || l === undefined) {
        return undefined;
      }
      return fromHsl(((h % 360) + 360) % 360, clamp(s / 100), clamp(l / 100), clamp(alpha));
    }
    case "oklch": {
      const l = channel(first, 1);
      const c = channel(second, 0.4);
      const h = hue(third);
      if (l === undefined || c === undefined || h === undefined) {
        return undefined;
      }
      const radians = (h * Math.PI) / 180;
      return fromOklab(l, c * Math.cos(radians), c * Math.sin(radians), clamp(alpha));
    }
    case "oklab": {
      const l = channel(first, 1);
      const a = channel(second, 0.4);
      const b = channel(third, 0.4);
      if (l === undefined || a === undefined || b === undefined) {
        return undefined;
      }
      return fromOklab(l, a, b, clamp(alpha));
    }
    default:
      return undefined;
  }
}

/**
 * Resolves a colour value to sRGB. `lookup` returns the value of another
 * token, for `var(--hm-…)` references. Returns `undefined` when the colour
 * can't be computed statically, such as `color-mix()` or a reference to a
 * token outside the theme.
 */
export function resolveColor(
  value: string,
  lookup: (token: string) => string | undefined,
  depth = 0,
): Rgba | undefined {
  if (depth > 16) {
    return undefined;
  }
  let nodes: readonly CssNode[];
  try {
    nodes = parseValue(value).nodes;
  } catch {
    return undefined;
  }
  const [node] = nodes;
  if (nodes.length !== 1 || node === undefined) {
    return undefined;
  }
  switch (node.kind) {
    case "hash":
      return fromHex(node.value);
    case "ident":
      return node.value === "white"
        ? { r: 1, g: 1, b: 1, alpha: 1 }
        : node.value === "black"
          ? { r: 0, g: 0, b: 0, alpha: 1 }
          : undefined;
    case "function": {
      if (node.name === "var") {
        const [property] = node.args;
        const referenced =
          property?.kind === "ident" ? lookup(property.value.slice("--hm-".length)) : undefined;
        return referenced === undefined ? undefined : resolveColor(referenced, lookup, depth + 1);
      }
      return fromFunction(node.name, node.args);
    }
    default:
      return undefined;
  }
}

/** Composites a translucent colour over an opaque one, as browsers do. */
function composite(top: Rgba, bottom: Rgba): Rgba {
  const mix = (a: number, b: number): number => a * top.alpha + b * (1 - top.alpha);
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), alpha: 1 };
}

/** WCAG 2.x relative luminance of an opaque sRGB colour. */
export function relativeLuminance(color: Rgba): number {
  return 0.2126 * toLinear(color.r) + 0.7152 * toLinear(color.g) + 0.0722 * toLinear(color.b);
}

/**
 * The WCAG 2.x contrast ratio of a foreground over a background, from 1 to 21.
 * A translucent foreground is composited over the background first. Returns
 * `undefined` for a translucent background, whose contrast depends on what's
 * behind it.
 */
export function contrastRatio(foreground: Rgba, background: Rgba): number | undefined {
  if (background.alpha < 1) {
    return undefined;
  }
  const front = foreground.alpha < 1 ? composite(foreground, background) : foreground;
  const lighter = Math.max(relativeLuminance(front), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(front), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}
