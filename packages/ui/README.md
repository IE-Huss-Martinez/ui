# @hussmartinez/ui

The design system of the `@hussmartinez` SDK family: design tokens, themes, base styles and accessible React components. Every SDK's editor uses it, and standalone applications can too.

> Status: not published yet. The package structure and its checks are in place; tokens, themes and components come next.

## Entry points

The package is ESM only ([ADR 0004](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0004-entry-points-and-module-format.md)).

| Entry | Contents |
|---|---|
| `@hussmartinez/ui` | Tokens, themes and theme helpers. No React and no DOM access on import, so it's safe in Server Components |
| `@hussmartinez/ui/react` | React components. Starts with `"use client"`. React and React DOM `>=18.3` are optional peer dependencies |
| `@hussmartinez/ui/styles.css` | All styles, in the cascade layers `hm.tokens`, `hm.base` and `hm.components`. Import it once in your application |

JavaScript never imports CSS, so your application decides where the stylesheet loads. Your own unlayered CSS overrides every `hm` layer without `!important` ([ADR 0005](https://github.com/hussmartinez/sdk-core/blob/main/docs/adr/0005-plain-css-with-cascade-layers.md)).

## License

[Apache-2.0](https://github.com/hussmartinez/ui/blob/main/LICENSE)
