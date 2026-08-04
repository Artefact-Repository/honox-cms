---
title: Static CSS via PandaCSS codegen (JSON→JS generator)
project: cms-page-builder
status: Draft
priority: Medium
assignee: Diego Ramos
dueDate: 2026-10-15
tags: [cms, page-builder, styling, pandacss, codegen, performance]
---

## Why

CMS page-builder blocks carry a raw `style` string in JSON (e.g. `content/pages/blog.json:4` → `"style": "color:#71717a;max-width:42rem;margin-bottom:2rem"`; also `index.json:111/147/154/321/...`, `docs.json:4/5`, and every locale variant). That string is injected as a **runtime inline `style` attribute** — it never goes through PandaCSS's static analyzer, so it produces runtime styles instead of the static, purge-safe, theme-aware utility classes the rest of the app uses. That's a deviation from the design-system's whole premise and bloats the rendered HTML.

Root cause: **PandaCSS does static analysis only** — `panda.config.ts:9` sets `include: ["./app/**/*.{js,jsx,ts,tsx}"]`, and the CMS source is JSON in `content/pages/`, outside that glob. Panda physically cannot see it. The team already works around this class of problem elsewhere: `panda.config.ts:31-46` force-generates `colorPalette` classes "because values come from CMS content at runtime, never literal JSX, so Panda's static extractor can't discover them on its own." This task extends that pattern to arbitrary per-block styles.

## Official Panda guidance (read these first)

- https://panda-css.com/docs/guides/dynamic-styling
- https://panda-css.com/docs/guides/static

Facts from the docs that shape the design:

1. **"Avoid runtime values whenever possible" is Panda's own first recommendation.** Its "static" category (literal `css({...})` calls, arbitrary values, inline constants in the same file) is the primary approach — and values from *other files or function calls* are silently **not** extracted. That's exactly why the generated file must contain literal calls and must live inside `app/` (the `include` glob).
2. **The current `--cms-*` bridge is an officially-sanctioned pattern** — the dynamic-styling guide's `token()` / `token.var()` / custom-property technique is the same mechanism `block-style.ts` uses (`var(--cms-*, initial)` static class + inline custom properties). So the structured layout fields are *already* Panda-native. The real gap is narrower than "we bypass Panda": it's the **raw `style` string** (arbitrary CSS) on the `manual` branch (`block-style.ts:204`) and the non-layout `...rest` spread.
3. **`staticCss` only works for a finite, enumerable set of values.** Free-form CSS strings can't be allowlisted — so the "just add it to `panda.config.ts`" shortcut (alternative C below) only becomes viable if CMS authoring is constrained to tokens (a product decision).
4. **`css.raw()` is an extraction hint** (identity fn) — useful for composition/Storybook, but for generated code the plain literal `css({...})` call is the guarantee. Don't add indirection.
5. **Performance caution (static guide):** pre-generating large style sets slows builds; be selective. Our dedupe-by-hash means the generated file holds only *distinct styles actually present in JSON* — naturally minimal. PurgeCSS is not needed (Panda only emits extracted classes).
6. **Same-file constants ARE extracted** ("Referenced values" in the dynamic guide), but literal objects in `css({...})` remain the safest guarantee — keep it literal.

## Current behavior (grounded)

- Layout blocks (Stack/Grid/Layout/Card): `app/components/page-registry.tsx` calls `extractLayoutStyle(propsOf(b))` (`block-style.ts`) which returns `layoutStyle.style`, applied via `style={layoutStyle.style}` at lines 302/335/496/1225. `block-style.ts` validates a *fixed allowlist* of structured fields (margin/padding/…) into `--cms-*` custom properties (a static class + inline custom props — semi-static), but its `manual` branch (line 204: `props.style`, the raw JSON `style` string) is passed **inline with no validation**.
- Non-layout blocks (text/heading/etc.): `propsOf(b)` (from `app/components/block-types.ts`) does **not** strip `style`, so the raw JSON `style` string spreads straight onto the element via `...rest` (e.g. `page-registry.tsx:346/355/391`) — fully runtime, also unsanitized.

Either way the JSON `style` string ends up as a runtime inline style. The proposed fix replaces that with generated static classes.

## Proposed solution — JSON→JS generator

A build-time generator that reads `content/pages/**/*.json`, extracts each block's `style` string, and emits a `.ts` module **inside `app/`** containing literal `css({...})` calls, so Panda's extractor picks them up statically.

1. **New script** `scripts/generate-cms-styles.mjs` (run via `bun`):
   - Walk `content/pages/**/*.json` (all locales; identical styles dedupe automatically).
   - Parse each `style` string → normalized object: split on `;`, `prop:value`, convert `kebab-case` → `camelCase` (Panda `css` takes camelCase: `max-width`→`maxWidth`, `margin-bottom`→`marginBottom`).
   - **Content-hash** the normalized CSS (e.g. short `sha1`) → stable id. Emit one `css({...})` literal per unique hash (dedupe across blocks/locales).
   - **Token-map values first (theme-aware upgrade).** Where a raw value matches a real design-system token, emit the token reference instead of the raw literal — e.g. `#71717a` → `var(--colors-gray-500)` if it equals a token value, or the existing `SHADOW_TOKENS` / `BORDER_COLOR_TOKENS` maps (`block-style.ts:66-83`) for shadow/border. This is what the bridge already does ("a select of real, theme-aware semantic tokens … so a border set here still looks right in dark mode"). Fall back to the raw literal only when no token matches. Net effect: generated classes are dark-mode-safe instead of hardcoded hex.
   - Emit `app/generated/cms-block-styles.ts`:
     ```ts
     // AUTO-GENERATED from content/pages/*.json — do not edit by hand.
     import { css } from "design-system/css";
     export const cmsBlockStyles = {
       "a1b2c3": css({ color: "#71717a", maxWidth: "42rem", marginBottom: "2rem" }),
       // ...
     } as const;
     ```
   - **CRITICAL:** the `css({...})` calls must be **literal object literals** (`css({ padding: "16px" })`), never `css(someVariable)` — only literals are statically analyzable by Panda. This is the whole point.
2. **Renderer consumes the map.** Add a helper in `block-style.ts` (e.g. `cmsStyleClass(styleString)`): normalize → hash → return `cmsBlockStyles[hash]`. The renderer applies that class instead of inline `style`:
   - Layout blocks: `extractLayoutStyle` returns the generated class for the `style` part (keep the `--cms-*` bridge for structured fields, or fold them into the generator too — see Decisions).
   - Non-layout blocks: intercept `style` in `page-registry.tsx` before the `...rest` spread and convert it to the generated class.
   - Given the hash is deterministic, the renderer needs **no path-based map** (reorder-safe); it just normalizes the same way the generator does.
3. **Build/Dev wiring (the integration point):**
   - `package.json` runs Panda only via `"prepare": "panda codegen"` (line 7); `dev`/`build` (lines 8-9) don't invoke it. The generator **must run before `panda codegen`** so the emitted file exists when Panda scans `app/**`.
   - Add a script `"generate:cms-styles": "bun run scripts/generate-cms-styles.mjs"` and chain it: `"prepare": "bun run generate:cms-styles && panda codegen"`. Add `predev`/`prebuild` hooks that run both, since dev/build don't currently call Panda.
   - Decide dev live-reload: a `chokidar` watcher on `content/pages/**` that re-runs the generator (+`panda codegen`) when a CMS file changes, vs. just regenerating on each `predev`/`prebuild` (simpler, cheap — JSON is tiny). Recommend the cheaper full-regen hook first; add a watcher only if live CMS tweaking demands it.

## Key constraints / pitfalls

- **Output location is load-bearing.** If the generated file lands outside `./app/**`, Panda won't see it and you get nothing. `app/generated/` is the right spot.
- **Literal-only `css()` calls.** Dynamic `css(variable)` → no static extraction. The generator emits literals; the renderer only *reads* `cmsBlockStyles`, never calls `css()` at runtime.
- **Sanitization.** The current `manual`/`style` path has **no validation** (unlike the structured-field allowlists in `block-style.ts`). Since the CMS is "treat as code-commit" (see `cms-security-escape-hatches`), raw CSS injection is lower-risk than the JS escape hatches — but the generator is the right place to (a) replicate the existing allowlist discipline and/or (b) decide policy for the raw `style` string. Don't regress the security posture: at minimum, reject `url()` with non-allowlisted schemes and `expression()`/`javascript:`.
- **Locale duplication.** Every `content/pages/<locale>/*.json` duplicates `style` strings; dedupe-by-hash keeps the generated file small.

## Decisions to settle in the PR

- **Fold the `--cms-*` bridge into the generator, or keep it?** The bridge (`block-style.ts`) was the *previous* workaround for the same static-analysis limit. Cleanest end-state: the generator emits proper `css({...})` for the structured layout fields too, and the bridge is retired. Pragmatic v1: generator handles only the raw `style` strings (the actual leak); bridge stays for layout fields. Recommend v1 first, retire bridge in a fast-follow.
- **Dev reload strategy** (full regen hook vs. watcher) — above.
- **Sanitization policy** for the raw `style` string (allowlist vs. accept per code-commit trust).

## Alternatives considered (and why this design wins)

- **A. JSON→JS codegen (chosen).** Literal `css({...})` calls emitted into `app/generated/` — Panda's own "static" category applied to JSON at build time. The only option that yields true static CSS for *arbitrary* values; purge-safe, SSR-safe, dark-mode-capable via token-mapping. Cost: build wiring + re-run on CMS changes (cheap — JSON is small).
- **B. Extend the `--cms-*` custom-property bridge.** Panda-sanctioned (guidance fact #2) and zero codegen — add more `--cms-*` vars + validation for the commonly-authored properties. Cap: can only ever express a curated property set, never arbitrary CSS. Fine as a cheap interim if build wiring is deferred, but its parser work mostly overlaps A — prefer A unless A is blocked.
- **C. `staticCss` allowlist in `panda.config.ts`.** Works only for finite, enumerable values (guidance fact #3). Free-form `style` strings can't be enumerated. Only viable if the CMS style editor is constrained to token pickers — a product change; revisit if that happens.
- **D. `cva` recipes for "style presets".** Panda's official answer for runtime lookup on *known objects*. Requires moving CMS authoring from free-form CSS to picking among curated presets (hero/muted/card…). Attractive endgame for consistency; a separate product conversation, not a fix for today's arbitrary strings.
- **E. Runtime injection (`injectStyle`/`getStyleTag`).** Rejected: not part of the dynamic-styling guide's recommended strategies, client-side-only → SSG flash/hydration mismatch, and it's still "runtime styles" — the exact thing we're eliminating.

**Recommendation:** ship **A** (the generator). If build wiring is a blocker, **B** is the sanctioned short-term patch — but don't build both; B's work mostly overlaps A's parser.

## Acceptance criteria

- No raw inline `style` string from CMS JSON reaches the DOM — rendered HTML uses a static Panda class instead.
- `app/generated/cms-block-styles.ts` exists, lives under `app/`, and contains literal `css({...})` calls.
- The generated classes appear in Panda's output (`design-system`) and resolve at runtime (verified: the `style="..."` attribute is absent in rendered CMS pages; the class is present).
- Identical `style` strings across blocks/locales share one generated class (dedupe).
- Build order verified: `panda codegen` runs after the generator (CI / `prepare` / `predev` / `prebuild`).
- No security/posture regression vs. current `block-style.ts` validation.

## Notes / dependencies

- Files to touch: `scripts/generate-cms-styles.mjs` (new), `app/generated/cms-block-styles.ts` (generated), `app/components/block-style.ts` (helper + optional bridge retirement), `app/components/page-registry.tsx` (`style` interception for non-layout blocks), `package.json` (script chaining), `panda.config.ts` (no change needed — `include` already covers `app/`).
- Pairs with `cms-security-escape-hatches`: the raw `style` field is an injection surface the current `manual` path leaves unsanitized; this task is the natural place to close that gap.
- Precedent in-repo: `staticCss.colorPalette` force-generation (`panda.config.ts:31-46`) already handles "CMS values at runtime" the same way this generator generalizes.
- References: https://panda-css.com/docs/guides/dynamic-styling and https://panda-css.com/docs/guides/static (summarized in "Official Panda guidance" above).
