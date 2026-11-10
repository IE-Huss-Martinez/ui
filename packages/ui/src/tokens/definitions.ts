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
 * What a token is, for tooling: its name, level, category and value type.
 * What each token is for is documented in the token reference,
 * `docs/tokens.md`, rather than shipped to applications (docs/adr/0001).
 *
 * @public
 */
export interface TokenDefinition {
  /** The name without the `--hm-` prefix, such as `color-accent`. */
  readonly name: string;
  /** Base, semantic or component (ADR 0006). */
  readonly level: TokenLevel;
  /** What the token styles, used to group the token reference. */
  readonly category: TokenCategory;
  /** The grammar its values must follow. */
  readonly type: TokenType;
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
  readonly density?: true;
};

const semantic = {
  "color-scheme": {
    category: "color",
    type: "color-scheme",
  },
  "color-bg": {
    category: "color",
    type: "color",
  },
  "color-surface": {
    category: "color",
    type: "color",
  },
  "color-surface-raised": {
    category: "color",
    type: "color",
  },
  "color-surface-sunken": {
    category: "color",
    type: "color",
  },
  "color-overlay": {
    category: "color",
    type: "color",
  },
  "color-text": { category: "color", type: "color" },
  "color-text-muted": {
    category: "color",
    type: "color",
  },
  "color-text-disabled": {
    category: "color",
    type: "color",
  },
  "color-border": {
    category: "color",
    type: "color",
  },
  "color-border-strong": {
    category: "color",
    type: "color",
  },
  "color-control": {
    category: "color",
    type: "color",
  },
  "color-control-hover": {
    category: "color",
    type: "color",
  },
  "color-control-active": {
    category: "color",
    type: "color",
  },
  "color-accent": {
    category: "color",
    type: "color",
  },
  "color-accent-hover": {
    category: "color",
    type: "color",
  },
  "color-accent-active": {
    category: "color",
    type: "color",
  },
  "color-on-accent": {
    category: "color",
    type: "color",
  },
  "color-accent-subtle": {
    category: "color",
    type: "color",
  },
  "color-accent-text": {
    category: "color",
    type: "color",
  },
  "color-danger": {
    category: "color",
    type: "color",
  },
  "color-danger-hover": {
    category: "color",
    type: "color",
  },
  "color-on-danger": {
    category: "color",
    type: "color",
  },
  "color-danger-subtle": {
    category: "color",
    type: "color",
  },
  "color-danger-text": {
    category: "color",
    type: "color",
  },
  "color-warning": { category: "color", type: "color" },
  "color-on-warning": {
    category: "color",
    type: "color",
  },
  "color-warning-subtle": {
    category: "color",
    type: "color",
  },
  "color-warning-text": {
    category: "color",
    type: "color",
  },
  "color-success": { category: "color", type: "color" },
  "color-on-success": {
    category: "color",
    type: "color",
  },
  "color-success-subtle": {
    category: "color",
    type: "color",
  },
  "color-success-text": {
    category: "color",
    type: "color",
  },
  "focus-ring-color": {
    category: "focus",
    type: "color",
  },
  "focus-ring-width": {
    category: "focus",
    type: "length",
  },
  "focus-ring-offset": {
    category: "focus",
    type: "length",
  },
  "focus-ring": {
    category: "focus",
    type: "outline",
  },
  "font-family": {
    category: "typography",
    type: "font-family",
  },
  "font-family-mono": {
    category: "typography",
    type: "font-family",
  },
  "font-size-small": {
    category: "typography",
    type: "length",
  },
  "font-size-body": {
    category: "typography",
    type: "length",
  },
  "font-size-title": {
    category: "typography",
    type: "length",
  },
  "font-weight-regular": {
    category: "typography",
    type: "font-weight",
  },
  "font-weight-strong": {
    category: "typography",
    type: "font-weight",
  },
  "line-height-body": {
    category: "typography",
    type: "number",
  },
  "line-height-tight": {
    category: "typography",
    type: "number",
  },
  "letter-spacing": {
    category: "typography",
    type: "length",
  },
  "control-height": {
    category: "size",
    type: "length",
    density: true,
  },
  "control-height-small": {
    category: "size",
    type: "length",
    density: true,
  },
  "control-padding-x": {
    category: "space",
    type: "length",
    density: true,
  },
  "control-gap": {
    category: "space",
    type: "length",
    density: true,
  },
  "icon-size": {
    category: "size",
    type: "length",
    density: true,
  },
  "target-size": {
    category: "size",
    type: "length",
    density: true,
  },
  "gap-tight": {
    category: "space",
    type: "length",
    density: true,
  },
  "gap-normal": {
    category: "space",
    type: "length",
    density: true,
  },
  "gap-loose": {
    category: "space",
    type: "length",
    density: true,
  },
  "inset-tight": {
    category: "space",
    type: "length",
    density: true,
  },
  "inset-normal": {
    category: "space",
    type: "length",
    density: true,
  },
  "inset-loose": {
    category: "space",
    type: "length",
    density: true,
  },
  "radius-control": {
    category: "shape",
    type: "length",
  },
  "radius-surface": {
    category: "shape",
    type: "length",
  },
  "radius-round": {
    category: "shape",
    type: "length",
  },
  "border-width": { category: "shape", type: "length" },
  "shadow-raised": {
    category: "shadow",
    type: "shadow",
  },
  "shadow-overlay": {
    category: "shadow",
    type: "shadow",
  },
  "motion-duration-feedback": {
    category: "motion",
    type: "duration",
  },
  "motion-duration-enter": {
    category: "motion",
    type: "duration",
  },
  "motion-duration-exit": {
    category: "motion",
    type: "duration",
  },
  "motion-easing-standard": {
    category: "motion",
    type: "easing",
  },
  "motion-easing-enter": {
    category: "motion",
    type: "easing",
  },
  "motion-easing-exit": {
    category: "motion",
    type: "easing",
  },
  "z-raised": {
    category: "z-index",
    type: "integer",
  },
  "z-sticky": {
    category: "z-index",
    type: "integer",
  },
  "z-overlay": {
    category: "z-index",
    type: "integer",
  },
  "opacity-disabled": {
    category: "opacity",
    type: "number",
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
  | "button-pressed-fg"
  | "toolbar-bg"
  | "toolbar-border-color"
  | "toolbar-radius"
  | "toolbar-padding"
  | "toolbar-gap"
  | "toolbar-group-gap"
  | "toolbar-separator-color"
  | "segmented-control-height"
  | "segmented-control-small-height"
  | "segmented-control-padding"
  | "segmented-control-gap"
  | "segmented-control-radius"
  | "segmented-control-bg"
  | "segmented-control-border-color"
  | "segmented-control-option-padding-x"
  | "segmented-control-option-fg"
  | "segmented-control-option-bg-hover"
  | "segmented-control-option-checked-bg"
  | "segmented-control-option-checked-fg"
  | "segmented-control-option-checked-border-color";

type ComponentSpec = { readonly fallback: SemanticTokenName };

const component = {
  "button-height": { fallback: "control-height" },
  "button-small-height": {
    fallback: "control-height-small",
  },
  "button-padding-x": { fallback: "control-padding-x" },
  "button-gap": { fallback: "control-gap" },
  "button-icon-size": { fallback: "icon-size" },
  "button-radius": { fallback: "radius-control" },
  "button-font-weight": {
    fallback: "font-weight-strong",
  },
  "button-bg": { fallback: "color-control" },
  "button-bg-hover": {
    fallback: "color-control-hover",
  },
  "button-bg-active": {
    fallback: "color-control-active",
  },
  "button-fg": { fallback: "color-text" },
  "button-border-color": {
    fallback: "color-border-strong",
  },
  "button-primary-bg": { fallback: "color-accent" },
  "button-primary-bg-hover": {
    fallback: "color-accent-hover",
  },
  "button-primary-bg-active": {
    fallback: "color-accent-active",
  },
  "button-primary-fg": { fallback: "color-on-accent" },
  "button-quiet-bg-hover": {
    fallback: "color-control-hover",
  },
  "button-quiet-bg-active": {
    fallback: "color-control-active",
  },
  "button-danger-bg": { fallback: "color-danger" },
  "button-danger-bg-hover": {
    fallback: "color-danger-hover",
  },
  "button-danger-fg": { fallback: "color-on-danger" },
  "button-pressed-bg": {
    fallback: "color-accent-subtle",
  },
  "button-pressed-fg": {
    fallback: "color-text",
  },
  "toolbar-bg": { fallback: "color-surface" },
  "toolbar-border-color": { fallback: "color-border" },
  "toolbar-radius": { fallback: "radius-surface" },
  "toolbar-padding": { fallback: "inset-tight" },
  "toolbar-gap": { fallback: "gap-tight" },
  "toolbar-group-gap": { fallback: "gap-tight" },
  "toolbar-separator-color": { fallback: "color-border" },
  "segmented-control-height": { fallback: "control-height" },
  "segmented-control-small-height": { fallback: "control-height-small" },
  "segmented-control-padding": { fallback: "gap-tight" },
  "segmented-control-gap": { fallback: "gap-tight" },
  "segmented-control-radius": { fallback: "radius-control" },
  "segmented-control-bg": { fallback: "color-surface-sunken" },
  "segmented-control-border-color": { fallback: "color-border-strong" },
  "segmented-control-option-padding-x": { fallback: "control-padding-x" },
  "segmented-control-option-fg": { fallback: "color-text" },
  "segmented-control-option-bg-hover": { fallback: "color-control-hover" },
  "segmented-control-option-checked-bg": { fallback: "color-surface-raised" },
  "segmented-control-option-checked-fg": { fallback: "color-text" },
  "segmented-control-option-checked-border-color": { fallback: "color-border-strong" },
} as const satisfies Record<ComponentTokenName, ComponentSpec>;

function baseDefinitions(): TokenDefinition[] {
  const list: TokenDefinition[] = [];
  const add = (name: BaseTokenName, category: TokenCategory, type: TokenType): void => {
    list.push({ name, level: "base", category, type, density: false });
  };
  for (const hue of HUES) {
    for (const step of STEPS) {
      add(`${hue}-${step}`, "color", "color");
    }
  }
  add("white", "color", "color");
  add("black", "color", "color");
  for (let step = 1; step <= 12; step++) {
    add(`space-${step}` as BaseTokenName, "space", "length");
  }
  for (const size of ["none", "sm", "md", "lg", "full"] as const) {
    add(`radius-${size}`, "shape", "length");
  }
  add("border-width-1", "shape", "length");
  add("border-width-2", "shape", "length");
  add("font-sans", "typography", "font-family");
  add("font-mono", "typography", "font-family");
  for (let step = 1; step <= 7; step++) {
    add(`font-size-${step}` as BaseTokenName, "typography", "length");
  }
  for (const weight of [400, 500, 600, 700] as const) {
    add(`font-weight-${weight}`, "typography", "font-weight");
  }
  for (const leading of ["tight", "normal", "relaxed"] as const) {
    add(`leading-${leading}`, "typography", "number");
  }
  for (const speed of ["fast", "normal", "slow"] as const) {
    add(`duration-${speed}`, "motion", "duration");
  }
  for (const easing of ["standard", "decelerate", "accelerate"] as const) {
    add(`easing-${easing}`, "motion", "easing");
  }
  return list;
}

function semanticDefinitions(): TokenDefinition[] {
  return Object.entries(semantic).map(([name, spec]) => ({
    name,
    level: "semantic",
    category: spec.category,
    type: spec.type,
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
