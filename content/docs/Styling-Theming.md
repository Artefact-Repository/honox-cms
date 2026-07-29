---
title: Styling & Theming
---

This project styles every component with [PandaCSS](https://panda-css.com) (type-safe, zero-runtime CSS-in-JS) on top of raw `hono/jsx` — **not** one of Panda's officially supported JSX frameworks (React/Vue/Solid/Qwik). That one fact — `jsxFramework: undefined` in `panda.config.ts` — is the root cause of nearly every styling regression this project has hit, because it silently opts the codebase out of several things Panda normally does for you. This page documents the resulting architecture, the concrete bugs it has already caused, and the checklist to follow so they don't recur.

---

## How styles get from a recipe to the page

1. **Recipes** are authored under `app/theme/recipes/*.ts` with Panda's `defineRecipe` (single class, e.g. `badge.ts`) or `defineSlotRecipe` (multi-part components with named slots, e.g. `switch.ts` — `root`/`control`/`thumb`/…).
2. Every recipe is registered by object key in `app/theme/recipes/index.ts`, under `recipes` (flat) or `slotRecipes` (slotted). **The registration key is what everything else refers to it by** — not the recipe's `className`, and not its file name. `switch.ts` exports `switchRecipe` (`switch` is a reserved word) and is registered as `switchRecipe: switchRecipe`; `panda.config.ts` and any code that references the recipe must use `switchRecipe`, never `switch`.
3. `panda.config.ts` extends `app/theme/`'s combined config (`theme: { extend: { ...theme.config } }`) and scans `include: ["./app/**/*.{js,jsx,ts,tsx}"]` for style usage.
4. Panda writes the generated system — recipe helper functions, tokens, patterns, the `css`/`cx` runtime — into `design-system/`, imported via the `design-system` Vite alias (`vite.config.ts`). **`design-system/` is gitignored** — it's a build artifact, regenerated fresh on every install/build via PostCSS (`postcss.config.cjs` wires `@pandacss/dev/postcss`) and the `prepare` script (`panda codegen`, run once on `bun install`). Only the *source* files — `app/theme/recipes/*.ts`, `panda.config.ts` — are what actually ship; nothing you do to `design-system/` directly is ever committed.

### `codegen` vs `cssgen` — you often need both, by hand

| Command | Regenerates | Needed after |
| --- | --- | --- |
| `bunx panda codegen` | `design-system/recipes/*.mjs` + `.d.ts` — the recipe helper functions (`switchRecipe()`, `.splitVariantProps()`, `.variantKeys`, `.variantMap`) that application code calls at runtime | Adding/removing/renaming a **variant** on any recipe |
| `bunx panda cssgen` | `design-system/styles.css` — the actual generated CSS rules | Adding/removing a **variant value**, or changing `staticCss` |

`vite dev`'s PostCSS integration re-extracts CSS on the fly as you edit, but it does **not** regenerate the recipe helper `.mjs`/`.d.ts` files — those are plain generated files your code imports directly (`import { switchRecipe } from "design-system/recipes"`), not a Vite-transformed virtual module. If you add a `colorPalette` prop to a recipe's `variants` and only save the file, `switchRecipe.splitVariantProps()` keeps using the **stale** `variantKeys` list until you run `panda codegen` — so the new prop gets silently routed into "local props" instead of "variant props", and either leaks onto the DOM as an invalid attribute or never reaches the style function at all. **Run both commands by hand after editing any recipe file**, don't assume the dev server picked it up.

---

## `staticCss`: why almost every recipe is forced to `["*"]`

Panda's static analysis can only pre-generate CSS for values it can see literally in source (`<Badge size="sm">`) — or, for JSX-framework integrations, via each recipe's `jsx: [...]` mapping (`button.ts` and a handful of others use this). This codebase's components are called as `recipeName(variantProps)` inside primitive files, always with a **runtime-computed object** (`switchRecipe.splitVariantProps(props)`), and most content is CMS-authored JSON (`content/pages/*.json`) with color/size/variant values that don't exist anywhere as a string literal in `.tsx` source at all. Panda's extractor cannot see any of this, so **every recipe without a `jsx` mapping must be forced to generate all its variant combinations** via `panda.config.ts`'s `staticCss.recipes: { <recipeKey>: ["*"] }` — using the *registration key* from `app/theme/recipes/index.ts`, not the recipe's `className`.

This is exactly how the switch-size bug (below) happened, and it's a systemic hazard: **any typo between `staticCss.recipes`'s key and the recipe's actual export/registration name silently drops that recipe's generation to zero non-default variants**, with no error, warning, or type failure anywhere — Panda just quietly emits base + default-variant CSS and nothing else. If you add a brand-new recipe, remember to add its registration-key entry to `staticCss.recipes` immediately, and double check the key matches `app/theme/recipes/index.ts` exactly (`grep` for the key in both files if unsure).

---

## Known regressions and the rules that prevent them

### 1. `staticCss.recipes` key must match the recipe's registration name, not its `className`

**Symptom:** every non-default variant value (e.g. `size="sm"`/`"lg"` on `<Switch>`) renders with the CSS custom properties simply unset — a collapsed, invisible 0×0 element, or missing styling entirely — while the default variant looks fine.

**Cause:** `switch.ts` exports `switchRecipe` (registered under that key in `slotRecipes`), but `panda.config.ts`'s `staticCss.recipes` had `switch: ["*"]` — a key that matches nothing. Only base + `defaultVariants` CSS ships (Panda always emits those regardless of `staticCss`); every other variant value silently gets zero generated CSS.

**Fix:** the key in `staticCss.recipes` must be the exact registration key from `app/theme/recipes/index.ts` (`switchRecipe`, not `switch`). This is easy to get wrong for any recipe whose file/className don't match its export name, and gives **zero** compile-time or runtime signal when wrong — verify by grepping the generated CSS for the variant class you expect (e.g. `grep "switch__root--size_sm" design-system/styles.css`) after any `staticCss` edit, don't just eyeball the config.

**This recurred three times** on the same recipe before actually landing, because `design-system/` is gitignored — running `cssgen` after fixing the config produces correct *local* output, but if the `panda.config.ts` edit itself is never committed, the bug returns the moment someone else regenerates. **The only durable part of any `staticCss`/recipe fix is the source file edit** (`panda.config.ts`, `app/theme/recipes/*.ts`) — always confirm with `git status`/`git diff` that those files are actually staged, not just that the local CSS looks right.

### 2. Slot-recipe variants must be slot-keyed, or Panda silently drops them

**Symptom:** a variant class is present in the rendered HTML (`carousel__root--colorPalette_green`), the intended style is completely absent, and the generated CSS has **zero** rules for that class at all — not even an empty one.

**Cause:** in a `defineSlotRecipe`, every variant value must nest its styles under the slot name it targets:

```ts
// WRONG — silently produces no CSS at all in a slot recipe
variants: {
  colorPalette: {
    blue: { colorPalette: "blue" },
  },
},

// RIGHT — slot-keyed
variants: {
  colorPalette: {
    blue: { root: { colorPalette: "blue" } },
  },
},
```

A flat `defineRecipe` (no slots — `badge.ts`, `anchor.ts`, `button.ts`) uses the *unslotted* form correctly; copying that pattern into a `defineSlotRecipe` (anything with a `slots: [...]` array) is the mistake. This has bitten `rating-group.ts`, `carousel.ts`, and `clipboard.ts` independently — it's an easy copy-paste trap between the two recipe kinds, and worth a second look any time a slot recipe's new variant "does nothing."

### 3. `base` conditional styles lose to `variant` styles for the same CSS property — always, regardless of specificity

**Symptom:** a conditional/state-driven style placed in a slot recipe's `base` block (e.g. `&[data-complete]: { borderColor: ... }`) never applies, even though the attribute/class is confirmed present in the DOM and the CSS rule itself is confirmed present in the stylesheet.

**Cause:** Panda emits `base` styles and `variants` styles into **separate CSS cascade layers**, with the variants layer ordered after base. CSS layer order beats selector specificity unconditionally — a highly-specific `base` selector still loses to a bare unconditional rule in the `variants` layer if they set the same property.

**Fix:** move the conditional override into **every relevant `variant.<name>.<slot>` block** instead of `base`, spreading a shared object into each if the styles repeat. `app/theme/recipes/input.ts`'s `_invalid` handling (duplicated per-variant, not centralised in `base`) is the existing reference pattern.

### 4. `colorPalette.*` tokens resolve to a real (gray-ish, near-black) color, never "no color" — an *active scope* is required

**Symptom:** a component styled with `bg: "colorPalette.solid.bg"` etc. renders in a dark, muted gray/black regardless of what `colorPalette` prop was passed (or even if the recipe has no `colorPalette` concept at all).

**Cause:** `colorPalette.*` are virtual tokens that resolve against whatever `--colors-color-palette-*` custom properties are in scope at that DOM node. The theme sets a **global default scope to `gray`** at `:root`/`html`, so anywhere no more specific colorPalette scope is active, `colorPalette.solid.bg` silently resolves to `gray.solid.bg` — not transparent, not an error, a real (dark) color. This is easy to misdiagnose as "broken" when it's actually just "unscoped."

**Fix:** apply an actual colorPalette scope, per the centralised pattern below — don't assume a component "just doesn't have color" because it looks gray/black.

### 5. Responsive variant props don't emit breakpoint CSS

`<Heading size={{ base: "2xl", md: "3xl" }}>` renders `class="heading--size_2xl md:heading--size_3xl"` correctly in HTML, but no `@media` rule for the `md:` class ever gets generated — `staticCss.recipes: ["*"]` only force-generates literal, non-responsive variant classes, it doesn't cross-product them with breakpoint conditions. **Never pass a responsive object as a variant prop**; use a flat literal value, or a wrapping `css()`/utility-class override for the specific property that needs to change per breakpoint (plain utility classes don't have this limitation, only recipe variant props do).

---

## `colorPalette` theming: the centralised pattern

Panda's officially-supported JSX frameworks get `colorPalette` "for free": their `styled()` wrapper auto-splits a `colorPalette` prop off any component and merges it in as a generic utility class, alongside whatever the recipe's own variants produce. **This repo doesn't get that**, because `jsxFramework: undefined`. Upstream [Park UI](https://park-ui.com) recipes (this project's original component source, ported by hand to `hono/jsx`) rely on exactly that missing integration — their own `switch.ts` has no `colorPalette` variant either.

For years for a subset of components, this was patched around by **hand-declaring a `colorPalette` variant on the recipe itself** (`badge.ts`, `anchor.ts`, `button.ts`, …), copy-pasting the same ~11-entry palette map into each one. That approach is what caused most of the bugs above: it's easy to forget on a new component (`switch.ts`/`avatar.ts`/`card.ts`/`checkbox.ts` never got it, so their `colorPalette` prop silently did nothing), easy to get the slotted-vs-unslotted form wrong (§2), and it scattered the same palette-name list — with drift — across a dozen files (some recipes' hand-rolled maps referenced `teal`/`indigo`/`pink`/`yellow`, palette names that don't even exist in this theme's `app/theme/colors/` — those would have silently done nothing too).

**The current pattern** (as of the `colorPalette` centralization pass) replaces all of that with one shared utility:

- `panda.config.ts`'s `staticCss.css` force-generates the plain Panda `colorPalette` utility class (`.color-palette_blue`, etc.) for every real palette name the theme actually defines (`gray`/`blue`/`green`/`red`/`orange`/`purple`/`cyan`/`amber` — check `app/theme/colors/*.ts` for the current list before adding a new name anywhere).
- `app/components/ui/color-palette.ts` exports `colorPaletteClass(colorPalette?: string)`, which resolves aliases (`success`→green, `error`→red, `warning`→orange, `slate`→gray — `slate` in particular is used throughout CMS content even though this theme's gray scale is only ever registered as `gray`) and returns the right utility class.

**To add `colorPalette` support to a component** (a component whose recipe references `colorPalette.*` tokens but has no way for a consumer to actually pick one):

1. Do **not** add a `colorPalette` variant to the recipe. Leave the recipe's `colorPalette.*` token references as-is.
2. In the component's primitive (`*-primitive.tsx`), destructure `colorPalette` out of the props **before** whatever `...rest`/`...restProps` spread lands on the DOM node — same as any other known prop — so it never leaks as an invalid `colorpalette="..."` HTML attribute.
3. If the component previously had a hardcoded default color, preserve it as a plain JS default on the destructure (`colorPalette = "blue"`), not a recipe `defaultVariants` entry.
4. Merge `colorPaletteClass(colorPalette)` into the **root/primary slot's** class list — `cx(styles.root, colorPaletteClass(colorPalette), classProp)` — so it cascades to descendant slots via normal CSS custom-property inheritance. It only needs to go on the outermost element that establishes the scope, never on every slot.
5. If the component is composed via a context provider (e.g. `ButtonGroup` → `Button` via `ButtonContext`), make sure `colorPalette` is threaded through that context value explicitly — it's no longer part of `variantProps`, so anything that used to forward `variantProps` alone to propagate color needs `colorPalette` added back in by hand.
6. Regenerate (`panda codegen && panda cssgen`) and verify: render the component, grep the SSR HTML (or `design-system/styles.css`) for the expected `color-palette_<name>` class, and confirm no bare `colorpalette=` attribute leaked onto the DOM.

Don't reintroduce a per-recipe `colorPalette` variant map for a new component — that's the exact pattern this centralization replaced, specifically because it doesn't scale and silently regresses.

---

## Token colors vs. semantic tokens

- **`tokens.colors`** (`app/theme/tokens/colors.ts`) — pure static values (black, white).
- **`semanticTokens.colors`** (`app/theme/index.ts`, `app/theme/colors/*.ts`) — the adaptive palette scales (gray/slate, blue, red, green, orange, purple, cyan, amber), each compiled into automatic light/dark custom properties.

**Avoid generic `bg`/`fg` tokens** — they compile to transparent/invalid CSS in this theme (the "Remove Panda Preset Colors" plugin in `panda.config.ts` strips Panda's default color preset, and generic `bg`/`fg` were never replaced). Use explicit semantic tokens instead: `gray.surface.bg`, `fg.default`, `gray.outline.border`, etc. Popups/dropdowns/autocomplete panels specifically should use `gray.surface.bg` (not `colorPalette.surface.bg`) so the panel background stays a neutral opaque surface regardless of whatever accent color is active on the trigger.

### Where the site-wide default accent actually lives

Every color file under `app/theme/colors/*.ts` (`amber`, `blue`, `cyan`, `green`, `orange`, `purple`, `red`, `slate`) is a fully-formed, ready-to-use `colorPalette` option — identical shape (a 1–12 scale, an a1–a12 alpha scale, and `solid`/`subtle`/`surface`/`outline`/`plain` sub-groups, each with `bg`/`fg`). A color existing in that directory only means it was generated (e.g. by the Park UI CLI at project init) — it says nothing about whether it's *active* anywhere.

**Nothing in Panda itself, and nothing in Park UI's CLI output (`components.json`), persists which color you pick as "the" accent during init** — there's no config key for it in either. The only thing that actually decides the site-wide default is one hand-written line:

```ts
// app/theme/global-css.ts
html: {
  colorPalette: "gray",
  // ...
},
```

This sets the root `colorPalette` scope every unscoped element inherits. It's a plain CSS declaration, easy to overlook, and easy to lose track of — if you ever wonder "why does this project use `gray` as its accent instead of `cyan`/whatever I picked at init," this line is the answer, and changing it is a one-line, low-risk edit (every color file has the identical token shape, so swapping the value is a clean drop-in).

**This default is a fallback only.** Any of the 13 components migrated to the centralised `colorPaletteClass()` pattern above (switch, badge, button, card, …) carry their **own** explicit default (see the per-component list in that section) and will not follow a change to this line — only components/utilities with no explicit `colorPalette` of their own (the global focus-ring/selection custom properties also declared in `global-css.ts`, and any not-yet-migrated recipe) actually read this root value.

### `fg`/`border`/`canvas` are deliberately gray-only, always

`fg.default`, `fg.muted`, `fg.subtle`, `border`, and `canvas` (declared in `app/theme/index.ts`'s `semanticTokens.colors`) are hardcoded directly to `colors.gray.*` — **not** `colors.colorPalette.*`. This is intentional, not a gap: it's the standard Radix/Park UI "one accent + one gray" convention — body text, borders, and page background must stay neutral regardless of which accent is active, both for contrast/readability and so the accent reads as an accent rather than tinting the whole page. Don't "fix" these to reference `colorPalette.*` expecting them to pick up the site accent; that would be a regression, not an improvement. Only genuinely interactive/branded surfaces (a control's checked state, a button's solid fill, a badge's background, …) should reference `colorPalette.*` — confirmed as the actual pattern in every control recipe (`switch.ts`, `checkbox.ts`, `badge.ts`, `button.ts`: the neutral/unchecked state uses a hardcoded `gray.*` token, the checked/accent state uses `colorPalette.*`).

---

## Verification checklist after any recipe or `panda.config.ts` change

Don't trust a visual glance — the bugs above all *looked* like nothing was wrong until inspected closely (a black/gray element reads as "default styling," not "broken").

1. `bunx panda codegen && bunx panda cssgen` (from the repo root — check `pwd` first; running these from a subdirectory silently writes `design-system/` into the wrong nested location instead of erroring).
2. Grep the generated CSS for the specific class you expect: `grep "switch__root--size_sm" design-system/styles.css`, `grep "color-palette_blue" design-system/styles.css`.
3. Render the actual page (dev server or `bun test`) and grep the SSR HTML output for the same class, and for the *absence* of any leaked raw prop name as a DOM attribute (`colorpalette="..."`, `size="..."` etc. on an element that shouldn't have it).
4. `bun test` — run the full unit suite; a stale test asserting an old classname format is a common false-positive after a styling refactor, worth a quick read before assuming a real regression.
5. `git status`/`git diff` the **source** files (`panda.config.ts`, `app/theme/recipes/*.ts`, `app/components/ui/*.tsx`) — never `design-system/`, which is gitignored and gets discarded. A fix that "works locally" but was never actually committed in the source is not a fix.

---

## FAQ

### How can I change the default site-wide accent color?

Edit one line in `app/theme/global-css.ts`:

```ts
html: {
  colorPalette: "cyan", // was "gray"
  colorScheme: { _light: "light", _dark: "dark" },
},
```

The value must be one of the palette names that actually exist under `app/theme/colors/*.ts` (`amber`, `blue`, `cyan`, `green`, `orange`, `purple`, `red`, `slate` — registered as `gray`). Every one of those files has the identical token shape (`solid`/`subtle`/`surface`/`outline`/`plain`, each with `bg`/`fg`), so this is a clean, safe swap — no other token needs to change alongside it.

Then:

1. `bunx panda codegen && bunx panda cssgen` to regenerate.
2. Check the result: `fg`/`border`/`canvas` (body text, dividers, page background) will **not** change — they're deliberately hardcoded to the neutral gray scale regardless of accent, see above. Only genuinely accent-driven surfaces (a checked switch/checkbox, a solid button, an unscoped badge, focus rings, text selection) will pick up the new color.
3. Remember this only changes the **fallback**. Any of the 13 components already migrated to `colorPaletteClass()` (switch, badge, button, anchor, card, checkbox, carousel, clipboard, date-picker, radio-card-group, rating-group) carry their own explicit per-component default and need each one updated by hand in its primitive (`app/components/ui/*-primitive.tsx`, the `colorPalette = "..."` destructure default) if you want them to follow the new site accent too, rather than keep their current individually-chosen default.
