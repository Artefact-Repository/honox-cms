---
title: Static CSS for CMS blocks — style presets (cva) + `--cms-*` escape hatch
project: cms-page-builder
status: Draft
priority: Medium
assignee: Diego Ramos
dueDate: 2026-10-15
tags: [cms, page-builder, styling, pandacss, presets, dark-mode]
---

## Why — evidence first

CMS blocks carry a raw `style` string in JSON that becomes a runtime inline `style` attribute — it skips PandaCSS's static analysis entirely (the original problem, see `content/pages/blog.json:4`, `index.json`, `docs.json`). The earlier draft proposed a JSON→JS codegen to emit literal `css({...})` calls.

**A vocabulary measurement (scan of all 38 `content/pages/**/*.json`, 279 blocks with raw `style`) changes the answer:**

- **31 distinct style strings** → **36 distinct (prop, value) pairs** across 21 properties.
- Structured layout fields (the `block-style.ts` allowlist): **29 distinct (field, value) combos**.
- Total authoring surface ≈ **65 pairs — tiny, and heavily repeated**: `text-align:center` ×121, `max-width:42rem` ×40, `font-weight:600` ×32, `margin:0 auto` ×30, `border-bottom:1px solid #e5e7eb` ×28…
- **Hardcoded light-mode hexes recur and are dark-mode bugs:** `#e5e7eb` ×28 (border-bottom), `#71717a` ×22, `#6b7280` ×1 — while the same color is also expressed as a token elsewhere (`color:var(--colors-fg-muted)` ×36). The token form already exists as precedent.

**Conclusion: the vocabulary is a preset.** Arbitrary-CSS codegen (the earlier proposal) is overkill — it solves a problem the data proves doesn't exist. The right design is to make the preset explicit, token-mapped, and Panda-static.

## Recommended design: D — a `cmsStyle` cva recipe (presets), with B as escape hatch

1. **New `app/components/cms-style.ts`** — a `cva` recipe `cmsStyle` whose variants encode the observed clusters (~10-12 presets), **token-mapped**:
   - `mutedLead` (fg.muted + maxWidth + marginBottom), `centerProse`/`centerBlock` (text-align center + maxWidth), `sectionDivider` (border-bottom → `colors.border` + paddingBottom), `overlineLabel` (uppercase + letterSpacing + fontSize), `strong` (fontWeight 600/bold), `pill` (borderRadius 9999px + padding), `linkReset` (textDecoration none), flex helpers, maxWidth/spacing scale variants…
   - Presets use **design tokens, not hexes** — `#e5e7eb` → `colors.border`, `#71717a` → `fg.muted`. This fixes the dark-mode debt the measurement exposed; it's the same token-mapping discipline `block-style.ts:66-83` (SHADOW_TOKENS/BORDER_COLOR_TOKENS) already uses.
   - Decomposition table from the 31 strings → presets is a PR decision (clusters above are the starting point).
2. **Register `cmsStyle: ["*"]` in `panda.config.ts` `staticCss.recipes`** (alongside the existing list, lines 59-112). Panda then force-generates *all* variants at build time → `cmsStyle({ preset })` with a runtime `preset` value is statically backed. This is the repo's existing pattern (config comment lines 48-58 explains why `["*"]` is required for runtime-destructured recipe calls) **and** Panda's officially recommended mechanism for dynamic lookups (see the dynamic-styling guide's "Recipes" section).
3. **CMS authoring change:** replace the free-form `style` string with a `stylePreset` select in `public/admin/config.yml` (mirror the existing curated selects, e.g. boxShadow). Editors pick a preset instead of typing CSS. Blocks become `"stylePreset": "mutedLead"`; the renderer applies `cmsStyle({ preset: block.stylePreset })`.
4. **Migration:** map the 31 existing strings onto the presets (scriptable table — ~279 `style` occurrences across files; verified by visual regression that rendered HTML matches current output). Decomposable `style` strings that combine two presets (e.g. `centerProse` + `sectionDivider`) get a composed variant or two classes — decide in the PR.
5. **Escape hatch (B — extended `--cms-*` bridge stays):** the sanctioned custom-property technique (`block-style.ts`) remains for one-off styles the preset vocabulary doesn't cover. Any `style` string that maps to a preset renders as the preset class; unmapped ones fall back to the bridge (allowlist-validated). No silent style loss, no regression path. Structured layout fields (margin/padding/borderRadius…) keep using the bridge unchanged in v1; folding them into presets is a fast-follow.

## Why not the alternatives (as primary)

- **A — codegen (previous proposal): rejected.** It solves "arbitrary CSS," which the measurement proves doesn't exist (36 pairs). Literal `css()` emission + build wiring + re-run-on-change is real machinery for a non-problem. Keep in the back pocket only if the vocabulary ever becomes unbounded.
- **B — extended bridge alone: rejected as primary, kept as escape hatch.** Sanctioned (dynamic-styling guide's custom-property technique) and zero-codegen, but values stay inline (semi-runtime), the free-form authoring surface stays (editors typing CSS), and the hex/dark-mode debt persists unless manually token-mapped per property.
- **C — `staticCss.css` allowlist: rejected as primary.** Technically viable (enumerate the 65 pairs in `panda.config.ts` → Panda pre-generates utility classes), but it (a) preserves the hex/dark-mode debt, (b) keeps free-form CSS authoring, (c) requires the allowlist to be kept in sync with content (drift → silent style loss), and (d) still needs a runtime parse + pair→class lookup layer. Presets (D) make the runtime trivial and the vocabulary bounded. C becomes the right choice only if we refuse the authoring change — then derive the allowlist from JSON at build time.
- **E — runtime `injectStyle`/`getStyleTag`: rejected** (not in the dynamic guide's recommended strategies, client-side-only → SSG flash, still runtime styles).

## Acceptance criteria

- Preset-mapped CMS blocks render via **static pre-generated classes** — no `style="..."` attribute in the rendered HTML for mapped blocks.
- `cmsStyle` variants all present in Panda's `design-system` output (via `staticCss.recipes`), and `cmsStyle({ preset })` resolves at runtime.
- **Hardcoded hexes gone from the authored vocabulary** (migrated to tokens) — dark-mode-correct rendering (spot-check the former `#e5e7eb`/`#71717a` spots in dark mode).
- Escape hatch still works for unmapped one-offs, with allowlist validation intact.
- Migration verified: rendered pages match current visuals (visual regression over the 11 en pages + locale variants).
- No regression in structured layout fields (bridge unchanged for those in v1).

## Decisions to settle in the PR

- Final preset list + decomposition table from the 31 strings; how multi-preset combos compose.
- Token mapping for each hardcoded hex (#71717a → which token, #e5e7eb → colors.border).
- `config.yml` widget shape (`stylePreset` select; no free-text — the escape hatch covers custom).
- Migration via script vs. hand-edit (~279 occurrences; scriptable).

## Notes / dependencies

- Files: `app/components/cms-style.ts` (new recipe), `panda.config.ts` (`staticCss.recipes` += `cmsStyle`), `public/admin/config.yml` (`stylePreset` widget), `content/pages/**/*.json` (migration), `app/components/block-style.ts` (escape hatch unchanged/extended), `app/components/page-registry.tsx` (`style` → preset application).
- Pairs with `cms-security-escape-hatches`: free-form `style` is an injection surface; presets **remove** that surface (curated select), and the escape hatch retains validation.
- References: https://panda-css.com/docs/guides/dynamic-styling (recipes for runtime lookups; custom-property technique) and https://panda-css.com/docs/guides/static (staticCss semantics).
- Supersedes the earlier `cms-static-css-codegen` proposal (A) — the vocabulary measurement ruled it out.
