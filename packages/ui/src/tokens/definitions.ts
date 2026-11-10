/**
 * The token definitions: every token's name, level, category, value type and
 * purpose. This is the single source the CSS, the types and the token
 * reference are generated from (ADR 0006).
 */

/**
 * The value types a token can have. Each type has its own grammar, which
 * {@link createTheme} checks values against.
 *
 * @public
 */
export type TokenType =
  | "color"
  | "length"
  | "duration"
  | "easing"
  | "number"
  | "integer"
  | "font-family"
  | "font-weight"
  | "shadow"
  | "outline"
  | "color-scheme";

/**
 * What a token is for, used to group the token reference.
 *
 * @public
 */
export type TokenCategory =
  | "color"
  | "typography"
  | "space"
  | "size"
  | "shape"
  | "shadow"
  | "motion"
  | "z-index"
  | "opacity"
  | "focus";

/**
 * Base tokens are raw scales that only other tokens use. Semantic tokens name
 * a purpose, and are what components use (ADR 0006).
 *
 * @public
 */
export type TokenLevel = "base" | "semantic" | "component";

/**
 * The description of one token.
 *
 * @public
 */
export interface TokenDefinition {
  /** The name without the `--hm-` prefix, such as `color-accent`. */
  readonly name: string;
  readonly level: TokenLevel;
  readonly category: TokenCategory;
  readonly type: TokenType;
  /** One sentence on what the token is for. */
  readonly description: string;
  /**
   * Whether density changes the token. Density tokens are set by
   * `data-hm-density`, not by the colour mode.
   */
  readonly density: boolean;
  /**
   * For component tokens, the semantic token they fall back to. `ui` never
   * declares component tokens; components read them as
   * `var(--hm-<name>, var(--hm-<fallback>))`, so a theme or host can set them
   * on any ancestor (docs/adr/0001).
   */
  readonly fallback?: SemanticTokenName;
}

/** The hues of the base colour palettes. */
export const HUES = ["gray", "blue", "red", "green", "amber"] as const;
/** The steps of every base colour palette, from lightest to darkest. */
export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/**
 * The names of the base tokens: the raw colour, space, radius, border, type
 * and motion scales.
 *
 * @public
 */
export type BaseTokenName =
  | `${"gray" | "blue" | "red" | "green" | "amber"}-${50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950}`
  | "white"
  | "black"
  | `space-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}`
  | "radius-none"
  | "radius-sm"
  | "radius-md"
  | "radius-lg"
  | "radius-full"
  | "border-width-1"
  | "border-width-2"
  | "font-sans"
  | "font-mono"
  | `font-size-${1 | 2 | 3 | 4 | 5 | 6 | 7}`
  | "font-weight-400"
  | "font-weight-500"
  | "font-weight-600"
  | "font-weight-700"
  | "leading-tight"
  | "leading-normal"
  | "leading-relaxed"
  | "duration-fast"
  | "duration-normal"
  | "duration-slow"
  | "easing-standard"
  | "easing-decelerate"
  | "easing-accelerate";

/**
 * The names of the semantic tokens, which components use.
 *
 * @public
 */
export type SemanticTokenName =
  | "color-scheme"
  | "color-bg"
  | "color-surface"
  | "color-surface-raised"
  | "color-surface-sunken"
  | "color-overlay"
  | "color-text"
  | "color-text-muted"
  | "color-text-disabled"
  | "color-border"
  | "color-border-strong"
  | "color-control"
  | "color-control-hover"
  | "color-control-active"
  | "color-accent"
  | "color-accent-hover"
  | "color-accent-active"
  | "color-on-accent"
  | "color-accent-subtle"
  | "color-accent-text"
  | "color-danger"
  | "color-danger-hover"
  | "color-on-danger"
  | "color-danger-subtle"
  | "color-danger-text"
  | "color-warning"
  | "color-on-warning"
  | "color-warning-subtle"
  | "color-warning-text"
  | "color-success"
  | "color-on-success"
  | "color-success-subtle"
  | "color-success-text"
  | "focus-ring-color"
  | "focus-ring-width"
  | "focus-ring-offset"
  | "focus-ring"
  | "font-family"
  | "font-family-mono"
  | "font-size-small"
  | "font-size-body"
  | "font-size-title"
  | "font-weight-regular"
  | "font-weight-strong"
  | "line-height-body"
  | "line-height-tight"
  | "letter-spacing"
  | "control-height"
  | "control-height-small"
  | "control-padding-x"
  | "control-gap"
  | "icon-size"
  | "target-size"
  | "gap-tight"
  | "gap-normal"
  | "gap-loose"
  | "inset-tight"
  | "inset-normal"
  | "inset-loose"
  | "radius-control"
  | "radius-surface"
  | "radius-round"
  | "border-width"
  | "shadow-raised"
  | "shadow-overlay"
  | "motion-duration-feedback"
  | "motion-duration-enter"
  | "motion-duration-exit"
  | "motion-easing-standard"
  | "motion-easing-enter"
  | "motion-easing-exit"
  | "z-raised"
  | "z-sticky"
  | "z-overlay"
  | "opacity-disabled";

/**
 * The semantic tokens that density changes: control sizes, gaps and insets.
 *
 * @public
 */
export type DensityTokenName =
  | "control-height"
  | "control-height-small"
  | "control-padding-x"
  | "control-gap"
  | "icon-size"
  | "target-size"
  | "gap-tight"
  | "gap-normal"
  | "gap-loose"
  | "inset-tight"
  | "inset-normal"
  | "inset-loose";

type SemanticSpec = {
  readonly category: TokenCategory;
  readonly type: TokenType;
  readonly description: string;
  readonly density?: true;
};

const semantic = {
  "color-scheme": {
    category: "color",
    type: "color-scheme",
    description:
      "Whether the theme is light or dark. Native scrollbars and form controls follow it.",
  },
  "color-bg": {
    category: "color",
    type: "color",
    description: "Background of the page or editor canvas.",
  },
  "color-surface": {
    category: "color",
    type: "color",
    description: "Background of panels and toolbars.",
  },
  "color-surface-raised": {
    category: "color",
    type: "color",
    description: "Background of dialogs, menus and popovers.",
  },
  "color-surface-sunken": {
    category: "color",
    type: "color",
    description: "Background of wells and recessed areas.",
  },
  "color-overlay": {
    category: "color",
    type: "color",
    description: "Backdrop behind modal dialogs. Usually translucent.",
  },
  "color-text": { category: "color", type: "color", description: "Body text and icons." },
  "color-text-muted": {
    category: "color",
    type: "color",
    description: "Secondary text, still readable at 4.5:1.",
  },
  "color-text-disabled": {
    category: "color",
    type: "color",
    description: "Text of disabled controls, which WCAG exempts from contrast.",
  },
  "color-border": {
    category: "color",
    type: "color",
    description: "Decorative borders and separators.",
  },
  "color-border-strong": {
    category: "color",
    type: "color",
    description: "Boundaries of controls, at 3:1 against surfaces.",
  },
  "color-control": {
    category: "color",
    type: "color",
    description: "Background of neutral controls.",
  },
  "color-control-hover": {
    category: "color",
    type: "color",
    description: "Background of neutral controls under the pointer.",
  },
  "color-control-active": {
    category: "color",
    type: "color",
    description: "Background of neutral controls while pressed.",
  },
  "color-accent": {
    category: "color",
    type: "color",
    description: "Fill of primary actions and selected states.",
  },
  "color-accent-hover": {
    category: "color",
    type: "color",
    description: "Accent fill under the pointer.",
  },
  "color-accent-active": {
    category: "color",
    type: "color",
    description: "Accent fill while pressed.",
  },
  "color-on-accent": {
    category: "color",
    type: "color",
    description: "Text and icons on the accent fill.",
  },
  "color-accent-subtle": {
    category: "color",
    type: "color",
    description: "Quiet background for selected or pressed items.",
  },
  "color-accent-text": {
    category: "color",
    type: "color",
    description: "Accent-coloured text, such as links, on surfaces.",
  },
  "color-danger": {
    category: "color",
    type: "color",
    description: "Fill of destructive actions.",
  },
  "color-danger-hover": {
    category: "color",
    type: "color",
    description: "Danger fill under the pointer.",
  },
  "color-on-danger": {
    category: "color",
    type: "color",
    description: "Text and icons on the danger fill.",
  },
  "color-danger-subtle": {
    category: "color",
    type: "color",
    description: "Quiet background for errors.",
  },
  "color-danger-text": {
    category: "color",
    type: "color",
    description: "Error text on surfaces and on the subtle danger background.",
  },
  "color-warning": { category: "color", type: "color", description: "Fill of warnings." },
  "color-on-warning": {
    category: "color",
    type: "color",
    description: "Text and icons on the warning fill.",
  },
  "color-warning-subtle": {
    category: "color",
    type: "color",
    description: "Quiet background for warnings.",
  },
  "color-warning-text": {
    category: "color",
    type: "color",
    description: "Warning text on surfaces and on the subtle warning background.",
  },
  "color-success": { category: "color", type: "color", description: "Fill of success states." },
  "color-on-success": {
    category: "color",
    type: "color",
    description: "Text and icons on the success fill.",
  },
  "color-success-subtle": {
    category: "color",
    type: "color",
    description: "Quiet background for success messages.",
  },
  "color-success-text": {
    category: "color",
    type: "color",
    description: "Success text on surfaces and on the subtle success background.",
  },
  "focus-ring-color": {
    category: "focus",
    type: "color",
    description: "Colour of the focus indicator, at 3:1 against surfaces.",
  },
  "focus-ring-width": {
    category: "focus",
    type: "length",
    description: "Thickness of the focus indicator.",
  },
  "focus-ring-offset": {
    category: "focus",
    type: "length",
    description: "Gap between a control and its focus indicator.",
  },
  "focus-ring": {
    category: "focus",
    type: "outline",
    description: "The focus indicator as an `outline` value (ADR 0014).",
  },
  "font-family": {
    category: "typography",
    type: "font-family",
    description: "Font of all interface text. Fonts are never fetched.",
  },
  "font-family-mono": {
    category: "typography",
    type: "font-family",
    description: "Font of code and tabular values.",
  },
  "font-size-small": {
    category: "typography",
    type: "length",
    description: "Captions, hints and dense labels.",
  },
  "font-size-body": {
    category: "typography",
    type: "length",
    description: "Body text and control labels.",
  },
  "font-size-title": {
    category: "typography",
    type: "length",
    description: "Dialog and panel titles.",
  },
  "font-weight-regular": {
    category: "typography",
    type: "font-weight",
    description: "Weight of body text.",
  },
  "font-weight-strong": {
    category: "typography",
    type: "font-weight",
    description: "Weight of titles and emphasis.",
  },
  "line-height-body": {
    category: "typography",
    type: "number",
    description: "Line height of running text.",
  },
  "line-height-tight": {
    category: "typography",
    type: "number",
    description: "Line height of single-line labels and titles.",
  },
  "letter-spacing": {
    category: "typography",
    type: "length",
    description: "Letter spacing of interface text.",
  },
  "control-height": {
    category: "size",
    type: "length",
    description: "Height of buttons, inputs and segmented controls.",
    density: true,
  },
  "control-height-small": {
    category: "size",
    type: "length",
    description: "Height of small controls, such as toolbar icon buttons.",
    density: true,
  },
  "control-padding-x": {
    category: "space",
    type: "length",
    description: "Inline padding of controls.",
    density: true,
  },
  "control-gap": {
    category: "space",
    type: "length",
    description: "Gap between a control's icon and label.",
    density: true,
  },
  "icon-size": {
    category: "size",
    type: "length",
    description: "Size of icons in controls.",
    density: true,
  },
  "target-size": {
    category: "size",
    type: "length",
    description: "Smallest pointer target: 24 px, and 44 px on coarse pointers (ADR 0014).",
    density: true,
  },
  "gap-tight": {
    category: "space",
    type: "length",
    description: "Gap between closely related items.",
    density: true,
  },
  "gap-normal": {
    category: "space",
    type: "length",
    description: "Gap between items in a group.",
    density: true,
  },
  "gap-loose": {
    category: "space",
    type: "length",
    description: "Gap between groups.",
    density: true,
  },
  "inset-tight": {
    category: "space",
    type: "length",
    description: "Padding of small containers.",
    density: true,
  },
  "inset-normal": {
    category: "space",
    type: "length",
    description: "Padding of panels and popovers.",
    density: true,
  },
  "inset-loose": {
    category: "space",
    type: "length",
    description: "Padding of dialogs.",
    density: true,
  },
  "radius-control": {
    category: "shape",
    type: "length",
    description: "Corner radius of controls.",
  },
  "radius-surface": {
    category: "shape",
    type: "length",
    description: "Corner radius of panels and dialogs.",
  },
  "radius-round": {
    category: "shape",
    type: "length",
    description: "Radius that makes pills and circles.",
  },
  "border-width": { category: "shape", type: "length", description: "Width of borders." },
  "shadow-raised": {
    category: "shadow",
    type: "shadow",
    description: "Shadow of menus and popovers.",
  },
  "shadow-overlay": {
    category: "shadow",
    type: "shadow",
    description: "Shadow of dialogs.",
  },
  "motion-duration-feedback": {
    category: "motion",
    type: "duration",
    description: "Duration of hover and press feedback.",
  },
  "motion-duration-enter": {
    category: "motion",
    type: "duration",
    description: "Duration of elements appearing.",
  },
  "motion-duration-exit": {
    category: "motion",
    type: "duration",
    description: "Duration of elements disappearing.",
  },
  "motion-easing-standard": {
    category: "motion",
    type: "easing",
    description: "Easing of movement within the screen.",
  },
  "motion-easing-enter": {
    category: "motion",
    type: "easing",
    description: "Easing of elements appearing.",
  },
  "motion-easing-exit": {
    category: "motion",
    type: "easing",
    description: "Easing of elements disappearing.",
  },
  "z-raised": {
    category: "z-index",
    type: "integer",
    description: "Stacking of raised elements within a component.",
  },
  "z-sticky": {
    category: "z-index",
    type: "integer",
    description: "Stacking of sticky headers and toolbars.",
  },
  "z-overlay": {
    category: "z-index",
    type: "integer",
    description: "Stacking of popovers that don't use the top layer.",
  },
  "opacity-disabled": {
    category: "opacity",
    type: "number",
    description: "Opacity of disabled controls.",
  },
} as const satisfies Record<SemanticTokenName, SemanticSpec>;

// The unions above are written out so the API reads plainly; these checks keep
// them in step with the definitions.
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;
type DensityKeys<T> = { [K in keyof T]: T[K] extends { density: true } ? K : never }[keyof T];
export type NamesMatch = Assert<Exact<SemanticTokenName, keyof typeof semantic>>;
export type DensityMatches = Assert<Exact<DensityTokenName, DensityKeys<typeof semantic>>>;
export type ComponentNamesMatch = Assert<Exact<ComponentTokenName, keyof typeof component>>;

/**
 * The name of any token `@hussmartinez/ui` defines.
 *
 * @public
 */
export type TokenName = BaseTokenName | SemanticTokenName | ComponentTokenName;

/**
 * The names of `ui`'s component tokens: fine-grained overrides for one
 * component, each falling back to a semantic token.
 *
 * @public
 */
export type ComponentTokenName =
  | "button-height"
  | "button-small-height"
  | "button-padding-x"
  | "button-gap"
  | "button-icon-size"
  | "button-radius"
  | "button-font-weight"
  | "button-bg"
  | "button-bg-hover"
  | "button-bg-active"
  | "button-fg"
  | "button-border-color"
  | "button-primary-bg"
  | "button-primary-bg-hover"
  | "button-primary-bg-active"
  | "button-primary-fg"
  | "button-quiet-bg-hover"
  | "button-quiet-bg-active"
  | "button-danger-bg"
  | "button-danger-bg-hover"
  | "button-danger-fg"
  | "button-pressed-bg"
  | "button-pressed-fg";

type ComponentSpec = { readonly fallback: SemanticTokenName; readonly description: string };

const component = {
  "button-height": { fallback: "control-height", description: "Height of buttons." },
  "button-small-height": {
    fallback: "control-height-small",
    description: "Height of small buttons.",
  },
  "button-padding-x": { fallback: "control-padding-x", description: "Inline padding of buttons." },
  "button-gap": { fallback: "control-gap", description: "Gap between a button's icon and label." },
  "button-icon-size": { fallback: "icon-size", description: "Size of icons in buttons." },
  "button-radius": { fallback: "radius-control", description: "Corner radius of buttons." },
  "button-font-weight": {
    fallback: "font-weight-strong",
    description: "Weight of button labels.",
  },
  "button-bg": { fallback: "color-control", description: "Background of secondary buttons." },
  "button-bg-hover": {
    fallback: "color-control-hover",
    description: "Background of secondary buttons under the pointer.",
  },
  "button-bg-active": {
    fallback: "color-control-active",
    description: "Background of secondary buttons while pressed.",
  },
  "button-fg": { fallback: "color-text", description: "Text of secondary and quiet buttons." },
  "button-border-color": {
    fallback: "color-border-strong",
    description: "Border of secondary buttons.",
  },
  "button-primary-bg": { fallback: "color-accent", description: "Background of primary buttons." },
  "button-primary-bg-hover": {
    fallback: "color-accent-hover",
    description: "Background of primary buttons under the pointer.",
  },
  "button-primary-bg-active": {
    fallback: "color-accent-active",
    description: "Background of primary buttons while pressed.",
  },
  "button-primary-fg": { fallback: "color-on-accent", description: "Text of primary buttons." },
  "button-quiet-bg-hover": {
    fallback: "color-control-hover",
    description: "Background of quiet buttons under the pointer.",
  },
  "button-quiet-bg-active": {
    fallback: "color-control-active",
    description: "Background of quiet buttons while pressed.",
  },
  "button-danger-bg": { fallback: "color-danger", description: "Background of danger buttons." },
  "button-danger-bg-hover": {
    fallback: "color-danger-hover",
    description: "Background of danger buttons under the pointer.",
  },
  "button-danger-fg": { fallback: "color-on-danger", description: "Text of danger buttons." },
  "button-pressed-bg": {
    fallback: "color-accent-subtle",
    description: "Background of toggle buttons that are on.",
  },
  "button-pressed-fg": {
    fallback: "color-text",
    description: "Text of toggle buttons that are on.",
  },
} as const satisfies Record<ComponentTokenName, ComponentSpec>;

function baseDefinitions(): TokenDefinition[] {
  const list: TokenDefinition[] = [];
  const add = (
    name: BaseTokenName,
    category: TokenCategory,
    type: TokenType,
    description: string,
  ): void => {
    list.push({ name, level: "base", category, type, description, density: false });
  };
  for (const hue of HUES) {
    for (const step of STEPS) {
      add(`${hue}-${step}`, "color", "color", `Step ${step} of the ${hue} palette.`);
    }
  }
  add("white", "color", "color", "Pure white.");
  add("black", "color", "color", "Pure black.");
  for (let step = 1; step <= 12; step++) {
    add(`space-${step}` as BaseTokenName, "space", "length", `Step ${step} of the space scale.`);
  }
  for (const size of ["none", "sm", "md", "lg", "full"] as const) {
    add(`radius-${size}`, "shape", "length", `The ${size} corner radius.`);
  }
  add("border-width-1", "shape", "length", "Thin border.");
  add("border-width-2", "shape", "length", "Thick border.");
  add("font-sans", "typography", "font-family", "The system sans-serif stack.");
  add("font-mono", "typography", "font-family", "The system monospace stack.");
  for (let step = 1; step <= 7; step++) {
    add(
      `font-size-${step}` as BaseTokenName,
      "typography",
      "length",
      `Step ${step} of the type scale.`,
    );
  }
  for (const weight of [400, 500, 600, 700] as const) {
    add(`font-weight-${weight}`, "typography", "font-weight", `Font weight ${weight}.`);
  }
  for (const leading of ["tight", "normal", "relaxed"] as const) {
    add(`leading-${leading}`, "typography", "number", `The ${leading} line height.`);
  }
  for (const speed of ["fast", "normal", "slow"] as const) {
    add(`duration-${speed}`, "motion", "duration", `The ${speed} duration.`);
  }
  for (const easing of ["standard", "decelerate", "accelerate"] as const) {
    add(`easing-${easing}`, "motion", "easing", `The ${easing} easing curve.`);
  }
  return list;
}

function semanticDefinitions(): TokenDefinition[] {
  return Object.entries(semantic).map(([name, spec]) => ({
    name,
    level: "semantic",
    category: spec.category,
    type: spec.type,
    description: spec.description,
    density: "density" in spec,
  }));
}

/**
 * Every token `@hussmartinez/ui` defines, base tokens first, in a stable
 * order. Use it to build token documentation or tooling.
 *
 * @public
 */
export const tokens: readonly TokenDefinition[] = /* @__PURE__ */ allDefinitions();

/** Every definition, frozen. A function, so importing this module has no side effects. */
function allDefinitions(): readonly TokenDefinition[] {
  const semanticList = semanticDefinitions();
  return Object.freeze(
    [...baseDefinitions(), ...semanticList, ...componentDefinitions(semanticList)].map(
      (definition) => Object.freeze(definition),
    ),
  );
}

/** Component tokens take their category and type from their fallback. */
function componentDefinitions(semanticList: readonly TokenDefinition[]): TokenDefinition[] {
  const byFallback = new Map(semanticList.map((definition) => [definition.name, definition]));
  return Object.entries(component).map(([name, spec]) => {
    const fallback = byFallback.get(spec.fallback) as TokenDefinition;
    return {
      name,
      level: "component",
      category: fallback.category,
      type: fallback.type,
      description: spec.description,
      density: false,
      fallback: spec.fallback,
    };
  });
}

/** Token definitions by name. */
export const tokensByName: ReadonlyMap<string, TokenDefinition> = /* @__PURE__ */ byName(tokens);

function byName(list: readonly TokenDefinition[]): ReadonlyMap<string, TokenDefinition> {
  return new Map(list.map((definition) => [definition.name, definition]));
}

/** The names of the density tokens, in definition order. */
export const densityTokenNames: readonly DensityTokenName[] = /* @__PURE__ */ densityNames();

function densityNames(): DensityTokenName[] {
  return tokens
    .filter((definition) => definition.density)
    .map((definition) => definition.name as DensityTokenName);
}
