---
title: Static CSS for CMS blocks — generalise the `--cms-*` bridge, real classes for categorical fields
project: cms-page-builder
status: To Do
priority: Medium
assignee: Diego Ramos
dueDate: 2026-10-15
tags: [cms, page-builder, styling, pandacss, dark-mode]
---

## Why — evidence first

CMS blocks carry a raw `style` string in JSON that becomes a runtime inline `style` attribute — it skips PandaCSS's static analysis entirely (`content/pages/blog.json:4`, `index.json`, `docs.json`, all locale variants). Two prior drafts on this same task addressed it:

- **Draft 1 (codegen):** JSON→JS generator emitting literal `css({...})` calls into `app/generated/`. Rejected after a vocabulary measurement.
- **Draft 2 (presets, superseded by this doc):** a vocabulary scan of all 38 `content/pages/**/*.json` (279 blocks with raw `style`) found **31 distinct style strings → 36 distinct (prop, value) pairs across 21 properties**, heavily repeated (`text-align:center` ×121, `max-width:42rem` ×40, `border-bottom:1px solid #e5e7eb` ×28…), with recurring hardcoded hexes (`#e5e7eb`, `#71717a`) that are dark-mode bugs since the same colors already exist as tokens elsewhere (`var(--colors-fg-muted)` ×36). Draft 2 concluded the vocabulary is small enough to be a curated `cva` preset set, authored via a `stylePreset` dropdown in `config.yml`, replacing free-form `style` entirely.

**This draft keeps Draft 2's measurement (still accurate — re-verified against the code below) but replaces its design.** Re-reading the two Panda guides against what's *already shipping in this codebase* surfaces a materially cheaper, lower-risk option that Draft 2 didn't consider.

## Official Panda guidance (verified by fetching both docs directly)

- https://panda-css.com/docs/guides/dynamic-styling
- https://panda-css.com/docs/guides/static

Confirmed facts (not paraphrase — pulled from the live pages):

1. **Panda's compiled `css()` is a build-time-hash / runtime-lookup function, not a static-analysis-only one.** The static guide: *"pre-generates a fixed set of utility classes at build time... enumerate exact values or use wildcards."* Once a `(property, value)` pair is enumerated in `staticCss.css`, **any runtime call** that produces that exact pair — literal object shape, but a value computed at runtime from anywhere, including JSON — resolves to real, already-generated CSS. The call site itself doesn't need to be statically analyzable; only the config enumeration does.
2. **The dynamic-styling guide lists four sanctioned strategies**, all already represented in this codebase to some degree: (a) recipes + `staticCss`, (b) CSS custom properties + `token()`, (c) `css.raw()` for composition, (d) `cva` recipes for variants. Values from other files, function-call results, or object-lookups-by-runtime-key are the things that **don't** get statically extracted — none of that applies to a literal `css({...})` call with an already-enumerated value.
3. **`staticCss` explicitly favors small, enumerated, explicit lists over wildcards**: *"Enumerate critical utilities — explicitly specify the styles you actually use rather than generating all possible combinations"*; wildcards (`['*']`) are cautioned against once a token set exceeds ~20 values. Draft 2's own measurement (36 pairs) is exactly the shape this guidance is written for — small and enumerable.
4. **This mechanism is not hypothetical — it's already running in production in this repo, for exactly this reason.** `panda.config.ts:31-46` force-generates the plain `colorPalette` utility for a fixed value list *because "values come from CMS content at runtime, never literal JSX, so Panda's static extractor can't discover them on its own."* `app/components/ui/color-palette.ts:36-41` (`colorPaletteClass`) then calls the real compiled `css({ colorPalette: runtimeValue })` with a value that is **only known at request time**, and it resolves correctly — proof, not theory, that "runtime value → literal-shaped `css()` call → pre-generated static class" works end-to-end here today for CMS-sourced values.
5. **Continuous values (arbitrary lengths — margin, padding, max-width) are a different problem than categorical values (text-align, font-weight, border-style, color selections) and Panda has a distinct sanctioned answer for each.** Enumeration (#1/#3) fits *categorical* value spaces. For genuinely open-ended values, the guide's answer is the custom-property/`token()` technique (#2) — which this repo *also* already ships, in `block-style.ts`'s `--cms-*` bridge. Draft 2 treated "the bridge" as a single alternative (B) to be mostly retired in favor of presets; the two Panda mechanisms actually solve two different halves of the same 36-pair vocabulary, and the codebase already has a working, validated implementation of both halves — just not applied completely or consistently.

## Current behavior (grounded in code)

- **Layout blocks** (Stack/Grid/Layout/Card): `page-registry.tsx` calls `extractLayoutStyle(propsOf(b))` (`block-style.ts`), which validates a fixed allowlist of structured fields (margin/padding/maxWidth/borderRadius/backgroundColor/backgroundImage/textAlign/opacity/boxShadow/border*) into `--cms-*` custom properties on one shared static class (`layoutStyleClass`, `block-style.ts:20-44`) — the sanctioned custom-property pattern, and it *is* validated (regexes + `SHADOW_TOKENS`/`BORDER_COLOR_TOKENS` token maps, `block-style.ts:46-96`). But its `manual` branch (`block-style.ts:204-205`, `props.style` — the raw JSON string) is concatenated into the inline `style` **with zero validation**, defeating the point.
- **Non-layout blocks** (heading/text/badge/…): `propsOf()` (`app/components/block-types.ts:27-30`) is explicitly documented as *"the single choke-point"* for stripping meta-keys before a block's props reach a component — but it doesn't touch `style`, so raw JSON `style` strings ride the `...rest` spread straight onto the DOM (e.g. `page-registry.tsx:386-392` for Heading/Text). No validation, no extraction, at all.
- Net: even where validation exists, it doesn't cover the actual leak (`manual`); where it doesn't exist, there's no interception point at all.

## Recommended design: generalise the bridge that already works, plus real classes for the categorical slice

No new files-of-generated-code, no CMS content migration, no `config.yml` authoring change. Two small, additive changes to code that already does 90% of this job:

**1. Close both leaks by extending validation to the full measured vocabulary, and moving the choke-point to `propsOf`.**

- Extend `block-style.ts`'s validators to cover every property the vocabulary scan found (not just the current ~14 `STYLE_KEYS`): add validated handling for `fontWeight`, `textTransform`, `letterSpacing`, `borderBottomColor`/`borderBottomWidth`/`borderBottomStyle` (the `border-bottom` shorthand — 28 occurrences), etc. — same style as the existing entries: a regex or a `Set`/token-map, silently drop what doesn't validate.
- Move the `style`-string parsing out of the `manual` per-field passthrough and into a real parser (split on `;`, `prop:value`, kebab→camelCase — this part of Draft 1's codegen design was correct and is small, reusable here) that runs the *same* validators, whether the block is layout or not.
- Wire the result into `propsOf()` (`block-types.ts:27`) itself, since it's already the documented single choke-point for prop-stripping — every block type gets covered by one code path instead of patching each renderer in `page-registry.tsx` individually. Layout blocks keep composing the result into `extractLayoutStyle`'s output; non-layout blocks get a small `cmsStyleClass`/`cmsStyleVars` application at the same choke-point.

**2. For the purely categorical subset, skip the custom-property indirection and emit real Panda utility classes** — using the *already-proven* mechanism from guidance fact #4 above, generalised past `colorPalette`:

- Properties whose vocabulary is a small closed set — `textAlign` (5 CSS values), `fontWeight` (2 values used: 600/bold), `textTransform` (uppercase), `borderStyle` (solid/dashed/dotted, already a `Set` in `block-style.ts`), and color-ish properties that route through the existing token maps (`SHADOW_TOKENS`, `BORDER_COLOR_TOKENS`, plus a new small color-token map for the two recurring hexes) — get registered as literal enumerated values in `panda.config.ts` `staticCss.css` (same array shape as the existing `colorPalette` entry, `panda.config.ts:31-46`).
- A small helper (same shape as `colorPaletteClass`, `app/components/ui/color-palette.ts:36-41`) calls the real compiled `css({...})` with the validated, token-mapped runtime value and returns a class name — genuinely zero-runtime-style for that slice, not just a validated custom property.
- Properties that are continuous (margin, padding, max-width, opacity, background-image URL, box-shadow) **stay on the existing `--cms-*` bridge** — that's the correct tool for open-ended values per guidance fact #5, and it's already implemented and battle-tested (`block-style.ts:20-44`). Don't try to enumerate arbitrary lengths into `staticCss.css`; that's the wrong tool for that shape of data, which is exactly the mistake Draft 1's codegen and Draft 2's preset-decomposition both risked at the edges.

**3. Anti-drift check (much smaller than Draft 1's codegen script, since it only diffs a list — emits nothing):** a script that scans `content/pages/**/*.json` for `style` declarations and fails CI if any validated categorical `(property, value)` pair is missing from `panda.config.ts`'s `staticCss.css` enumeration. Turns "silent style loss on new content" into a build failure instead of a runtime surprise. Run alongside `panda codegen` (`package.json:7`, `prepare`).

## Why this beats both prior drafts

- **vs. Draft 1 (codegen):** No new generated file, no build-order wiring (`predev`/`prebuild` hooks, watcher decision), no re-deriving validation from scratch — reuses `block-style.ts`'s existing regexes/token-maps almost entirely. Draft 1's vocabulary-measurement rebuttal (36 pairs, not "arbitrary CSS") applies here too and is exactly why enumeration-in-config beats a codegen pipeline.
- **vs. Draft 2 (presets):** No `config.yml` UX change, no migrating 279 existing `style` occurrences to `stylePreset` values, no "combined strings need a composed preset variant or two classes" edge case (Draft 2's own doc admits this problem) — every property here validates and composes independently, the same way `layoutStyleClass` already composes margin+padding+maxWidth+textAlign simultaneously today. Draft 2's dark-mode fix (token-mapping recurring hexes) is preserved here via the same `SHADOW_TOKENS`/`BORDER_COLOR_TOKENS`-style maps, just applied per-property instead of per-preset.
- **Already running in production here.** This isn't a new pattern being introduced on trust — `colorPaletteClass` + the `staticCss.css` `colorPalette` entry is the categorical half of this design, shipped and working, today. The continuous half (`--cms-*` bridge) is equally already shipped for layout blocks. This design is "finish applying two things you already built everywhere they're needed," not "build a third thing."
- **Correction to Draft 2's characterization of the bridge:** Draft 2 called the `--cms-*` technique "semi-runtime" and downgraded it to an escape hatch. That undersells it — it's Panda's own officially sanctioned custom-property/`token()` strategy (guidance fact #2), the generated CSS *is* fully static and purge-safe; only the per-instance values sit in an inline custom-property attribute. The one place Draft 2's instinct was right: a `--cms-*` block *does* still render a `style="..."` attribute (holding custom-property assignments, not raw declarations) — so if the acceptance bar is read as "literally zero `style` attribute, ever," only the categorical/class slice (#2 above) fully satisfies it. Recommend relaxing that criterion to "no unsanitized/arbitrary CSS reaches the DOM," which is the actual security and staticness goal — see Acceptance criteria below.

## Alternatives considered

- **A. JSON→JS codegen.** Rejected — see Draft 1; solves "arbitrary CSS," which the measurement disproves.
- **B. `--cms-*` bridge alone, unchanged scope.** Already shipped for layout blocks' structured fields; this design keeps and extends it rather than replacing it — it's half of the recommendation, not a rejected alternative.
- **C. `staticCss.css` allowlist alone (no bridge).** Would force continuous values (margin, arbitrary max-width) into enumeration too, which is the wrong tool (guidance fact #5) — every new spacing value would need a config PR. This design uses enumeration only for the genuinely categorical slice, where it's the right tool.
- **D. `cva` preset recipes + `config.yml` dropdown (Draft 2).** Superseded by this doc — see comparison above. D's authoring-UX benefit (non-technical editors picking a named preset instead of typing CSS) is real but decoupled from the static-CSS problem; it can be layered on top of this design later as sugar (a `stylePreset` field that expands to a `style` string server-side, still flowing through the same validators) if editor UX becomes the active complaint. Not needed to ship the static-CSS fix.
- **E. Runtime `injectStyle`/`getStyleTag`.** Rejected — not in the dynamic guide's recommended strategies, client-side-only → SSG flash/hydration mismatch, still runtime styles.

## Acceptance criteria

- No **unvalidated/arbitrary** CSS from CMS JSON reaches the DOM — every declaration in a block's `style` string is either (a) a validated categorical value → real static Panda class, (b) a validated continuous value → `--cms-*` custom property on the existing static class, or (c) dropped.
- Both leaks closed: the `manual` branch (`block-style.ts:204`) and the non-layout `...rest` leak (`page-registry.tsx`, via `block-types.ts:27` `propsOf`) go through the same validator.
- `panda.config.ts` `staticCss.css` enumerates the categorical vocabulary; a new helper alongside `colorPaletteClass` resolves it to real classes at runtime.
- Hardcoded hexes (`#e5e7eb`, `#71717a`) migrate to token references via the categorical/color path — dark-mode spot-check passes.
- CI fails if new CMS content introduces a categorical `(property, value)` pair missing from the `staticCss.css` enumeration (anti-drift check).
- No regression: rendered pages visually match current output (spot-check the 11 en pages + locale variants).

## Decisions to settle in the PR

- Exact property list to promote to the categorical/class path vs. keep on the `--cms-*` bridge (starting point: `textAlign`, `fontWeight`, `textTransform`, `borderStyle`, border/text color tokens → categorical; margin/padding/maxWidth/opacity/backgroundImage/boxShadow-length-ish parts → bridge).
- Token mapping table for the two recurring hexes.
- Anti-drift script: fail CI vs. warn-only for v1.

## Notes / dependencies

- Files: `app/components/block-style.ts` (extend validators + parser, both branches), `app/components/block-types.ts` (`propsOf` choke-point), `app/components/ui/color-palette.ts` (pattern to generalise, maybe a new sibling helper), `panda.config.ts` (`staticCss.css` += categorical vocabulary), `app/components/page-registry.tsx` (remove now-redundant per-renderer plumbing where `propsOf` covers it), `scripts/check-cms-style-vocab.mjs` (new, small).
- Pairs with `cms-security-escape-hatches`: closes the one unvalidated CSS-injection surface (`manual` branch) the current bridge left open.
- References: https://panda-css.com/docs/guides/dynamic-styling and https://panda-css.com/docs/guides/static (both fetched and quoted directly above, not paraphrased from memory).
- Supersedes `cms-static-css-presets.md` (Draft 2 — `cva` presets), which itself superseded `cms-static-css-codegen.md` (Draft 1). Draft 2's vocabulary measurement is retained and re-cited above; only the design changed.
