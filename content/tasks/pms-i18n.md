---
title: [PMS] Extract Projects & Tasks pages to CMS for i18n
project: pms
status: To Do
priority: Medium
assignee: Mia Chen
dueDate: 2026-10-31
tags: [pms, i18n, cms, content-extraction, ui]
---

## Why

The PMS (Projects & Tasks) surface is **English-only**, and it's the last untranslated surface on a site that advertises 6+ locales (en/zh/pt/de/fr/es + `pr`). The rest of the site does i18n the **content way**: chrome lives in CMS pages (`content/pages/<slug>.json` + `content/pages/<locale>/<slug>.json`) and `loadPage(slug, locale)` falls back to `en` automatically. PMS should use the same mechanism instead of a code-level string dictionary — it's consistent with docs/blog/pages, editors translate via the CMS without code deploys, and all the machinery already exists (`detectLocale`, `localeToggleUrl`, locale fallback).

Two structural facts make this a *consistency fix*, not just a translation task:

- **`/tasks` is already CMS-driven but half-wired**: `app/routes/tasks/index.tsx` renders `loadPage("tasks", …)` content (`headerBrand`/`headerNav`/`headerActions` + body blocks) — **but hardcodes `"en"` at line 20**, and its filter-splice (below) matches English text.
- **`/projects` is fully hardcoded SSR**: `app/routes/projects/index.tsx` has no `loadPage` at all — h1 "Projects", intro, search placeholder, empty state, "Due", `${done}/${total} tasks` are all literals. And **no `content/pages/projects.json` exists**.

So the fix is: extract the page chrome into CMS pages, add locale variants, and rewire both routes through the existing pattern.

## Design — content extraction (replaces the earlier string-dictionary plan)

1. **Create `content/pages/projects.json` (en)** mirroring `tasks.json`'s structure (`title`, `headerBrand`, `headerNav`, `headerActions`, `content`) — the projects page chrome as blocks: h1, intro ("Git-backed project tracking…"), search empty-state text, and any header links currently hardcoded in the route (lines 155-198 of `projects/index.tsx`).
2. **Rewire `/projects` to the tasks-index pattern**: `loadPage("projects", locale)` + `PageRenderer` for `headerBrand`/`headerNav`/`headerActions` and the body; keep the data-driven widgets (search box, `ProjectStatusFilter`, `ProjectRowActionsMenu`, the project card grid) injected around the CMS content the way the tasks page injects its filter islands. This closes the `/projects`-hardcoded-vs-`/tasks`-CMS inconsistency for good.
3. **Locale variants**: create `content/pages/<locale>/projects.json` and `content/pages/<locale>/tasks.json` for every locale in `TRANSLATED_LOCALES` (currently only about/blog/docs/index have variants; `tasks.json` has none; `projects.json` won't exist until step 1). en is the fallback for anything untranslated.
4. **Locale wiring in routes**: call `detectLocale(c.req.path)` and pass the result to `loadPage` — concretely **replace the hardcoded `"en"` at `app/routes/tasks/index.tsx:20`**, and do the same for `projects/index.tsx`, `projects/[slug].tsx`, `tasks/[slug].tsx`.
5. **Locale switcher**: reuse the existing `localeToggleUrl` (already exported by `app/lib/i18n.ts` and used by CMS pages' locale-toggle block) so PMS pages get the same language switch.

### CRITICAL gotcha — the filter-splice breaks on translation

`app/routes/tasks/index.tsx:64-102` finds where to inject the Project/Assignee/Status/Priority filter islands by **matching English text** in the CMS content (`child.content === "Project"` etc.). In a translated page those labels are no longer English → `findIndex` returns -1 → **filters silently vanish**. The splice must be keyed by a stable marker (e.g. a dedicated marker `blockType`, or a stable `key`/id on the filter-row stacks) instead of content text, so it works in every locale. Do this *before* or with the translations, and add a test/assert that the splice still injects on a non-en page.

**Better still: the splice can be deleted entirely** — see the bindings end-state below.

## End-state: recreate the features with CMS bindings/APIs (the real fix)

The extraction plan above removes *page chrome* from code; this section removes the *features* too. The app already has a full binding/API layer — it's just only wired for `tasks.json`'s table:

- **`resolveBlockDataSources`** (`app/lib/pages.ts:89`) runs at `loadPage` time (server-side, works under SSG). For every `each` block with a `dataSource` name (or literal `items`), it calls `resolveDataSource(name, ctx)` (`app/lib/data-sources.ts:95`) → `DataSourceItem[]` → renders the block's `template` per item via `interpolateBlock` (`{{item.foo}}`, pages.ts:48). It walks `content`, `headerBrand`, `headerNav`, and `headerActions` (pages.ts:147-150) — the header chrome is already fully data+content driven.
- **`dataSources`** (data-sources.ts:41) exposes `projects`, `taskAssignees`, `taskStatuses`, `taskPriorities` — each returns uniform `{label, value, href?, colorPalette?}` items. **`taskStatuses`/`taskPriorities` hardcode `loadDocsConfig("en")`** (lines 64/78) — a locale hole that must close.
- **`customTableDataResolvers`** (data-sources.ts:117) — the escape-hatch pattern for bespoke features: a *named resolver* fetches/shapes exactly what its matching *presentational renderer* needs (see the `tasks` resolver + `components/custom-table-renderers.tsx`), keeping renderers synchronous inside page-registry's render pipeline.

So "recreate the same features with bindings" = add block types to the registry that bind islands/data to content, and let each locale's JSON supply the chrome via block props. Mapping:

| Hardcoded today (route/island) | CMS binding |
|---|---|
| Project card grid (projects/index.tsx:240-346) | `each` block, `dataSource: "projects"` + card template; extend the `projects` resolver (or a rich `projectStats` resolver) to emit `summary/status/dueDate/owner/tags/done/total` — `DataSourceItem` grows optional fields |
| Status/Priority/Assignee/Project filters (TaskStatusFilter etc.) | New bound block types `statusFilter`/`priorityFilter`/`assigneeFilter`/`projectFilter`: registry renderers mount the islands; options bound from the existing `taskStatuses`/`taskPriorities`/`taskAssignees`/`projects` sources; heading/placeholder labels are block props (`{ blockType: "statusFilter", heading: "状态" }`) |
| Search box (both pages) | Bound `searchBox` block: props from content — `src` (`/api/projects/search.json` / `/api/tasks/search.json` — endpoints already exist), `placeholder` (translated per locale), `action`, `filterAttribute`, `emptyStateId` |
| Create menu (PmsCreateMenu, tasks/index.tsx:190) | Bound `pmsCreateMenu` block in `headerActions`; project/task option items resolved via `dataSources` (the route currently passes `projectItems`/`taskItems` by hand) |
| Row-actions menus | Bound at the renderer level — same pattern as `customTableDataResolvers.tasks` passing `projectItems`/`taskItems`/colors to the table renderer; the project grid's card template carries the same data via its resolver |
| Board columns / drag-to-status / inline edit | Bound `taskBoard` block (island); column labels from content, status options from `taskStatuses` |
| h1 / intro / empty states | Plain content blocks (already the plan) |

**Why this is the real i18n fix:** every feature's chrome becomes a *block prop* in each locale's JSON — the CMS page *is* the translation unit; there's no code dictionary, no English-text splice, no label map. The data stays English-keyed (status/priority values, slugs); only displayed labels translate. And the splice in tasks/index.tsx is **deleted**, not patched: content declares `<statusFilter>` explicitly.

**The two API-shaped changes required:**

1. **`DataSourceContext` gains `locale`** (data-sources.ts:25). `loadPage(slug, locale, ctx)` threads it through `resolveBlockDataSources` → `resolveDataSource`, so the config-reading resolvers (`taskStatuses`/`taskPriorities`/custom `tasks` — all `loadDocsConfig("en")` today) use the right locale's `pms.*Colors`/labels. Small, precise; also fixes the existing `"en"` holes.
2. **Richer resolver items.** `DataSourceItem` (data-sources.ts:32) is `{label, value, href?, colorPalette?}` — enough for filters/menus, not for a project card (summary, dueDate, owner, tags, done/total). Either extend it with optional fields, or use the custom-table pattern (rich resolver + matching presentational renderer) for the grid/board. The latter is the proven path (see `tasks`).

**Registry + schema:** every new block type needs a renderer in `page-registry.tsx`'s `registry` **and** a matching widget in `public/admin/config.yml` so editors can add them. That's exactly the drift surface `cms-registry-schema-drift-ci` guards — land the CI check first (or together) so these additions are safe. Bound islands must accept their chrome from block props (falling back to today's defaults) — a mechanical change to each island.

**Sequencing:** v1 = chrome extraction + marker-splice fix (this task's core). End-state = bindings — do it as this task's second phase or a follow-up that also **retires the splice**. Overlaps `cms-datasource-showcase` (building a Projects page via `each`/`dataSource` is literally the first row of the table) — coordinate so they don't build the same grid twice.

## What stays in code (residual, decide the split)

- **User-authored content** (`content/projects/*.md`, `content/tasks/*.md` titles/descriptions/assignees) is operational data — not translated, like a DB row.
- **Data-driven widget labels** (status/priority pills in `task-status-filter.tsx:61-75`, board columns in `task-board.tsx`, `"Due"`/date formatting): these are keyed by English *values*. In the bindings end-state they arrive as **block props** from each locale's content (the bound filter/board blocks carry `labels`); in the interim v1 they need a small label map keyed by the English value (kept from the earlier `pms-i18n` draft). Colors (`mergeColorOverrides`) stay keyed on the value, untouched.
- **Drawer/menu chrome** (create/edit/archive/delete copy in the islands): page-level chrome moves to CMS; deep component strings either come along in the label map or are accepted as English for v1 — decide the line in the PR.

## Decisions to settle in the PR

- **Filter-splice mechanism**: marker `blockType` vs. stable key — pick the one that survives CMS edits and locale content. (End-state deletes the splice entirely via bindings.)
- **Bindings end-state vs. interim**: the bound-block approach (above) is the i18n-correct end-state and deletes the splice; the marker fix is the safe v1 while the block types land. Decide the phase boundary and whether to fold in the `cms-datasource-showcase` grid work.
- **Locale-prefixed routes** (`/[locale]/projects`, `/[locale]/tasks` like docs/blog — `ssgParams` + `server.ts` redirect + `localiseHref`) vs. unprefixed paths with `detectLocale` + in-page translation only. Recommend unprefixed v1; revisit if PMS becomes a first-class translated section.
- **Scope of extraction**: listing pages first (this task); detail pages (`projects/[slug]`, `tasks/[slug]`) as a fast-follow, or include now.
- **Residual labels**: small code label map vs. CMS-driven for status/priority pills.

## Acceptance criteria

- `content/pages/projects.json` exists (en) and `/projects` renders it; `loadPage` calls in all 4 PMS routes pass the detected locale (no hardcoded `"en"`).
- Locale variants exist for `projects.json` + `tasks.json` across `TRANSLATED_LOCALES`; a `zh` visit shows translated headings/intro/empty-state; untranslated locales fall back to en.
- **Filter islands still inject on a translated page** (the splice gotcha is fixed and verified on non-en content).
- Locale switcher present and functional on both PMS pages.
- No new inline `currentLocale === "x" ? ... : ...` literals introduced for page chrome.
- `/projects` and `/tasks` share the same CMS-driven architecture (consistency goal met).
- End-state (bindings phase): filter islands, search, create menu, and project grid render from bound block types with per-locale block props — no splice, no route-level feature code; resolvers read locale-aware config (no `loadDocsConfig("en")` holes).

## Notes / dependencies

- `app/lib/i18n.ts` already exports `detectLocale`, `isLocale`, `localiseHref`, `stripLocale`, `localeToggleUrl`, `TRANSLATED_LOCALES`, `ALL_LOCALES` — reuse, don't reinvent.
- Binding layer references: `app/lib/data-sources.ts` (`dataSources` :41, `customTableDataResolvers` :117, `resolveDataSource` :95, `DataSourceContext` :25), `app/lib/pages.ts` (`resolveBlockDataSources` :89, `interpolateBlock` :48, `loadPage` walks content/headerBrand/headerNav/headerActions :147-150). `taskStatuses`/`taskPriorities`/custom `tasks` hardcode `loadDocsConfig("en")` — closed by threading locale through `DataSourceContext`.
- Coordinate with `cms-datasource-showcase` (Projects page via `each`/`dataSource`) and `cms-registry-schema-drift-ci` (every new bound block type touches registry ↔ `config.yml`).
- `content/pages/settings/pms.json` is an unrelated settings-section page — do not confuse with the PMS surface.
- Pairs with `cms-page-i18n-coverage` (same content-extraction mechanics, other side of the app) and the `docs-i18n-coverage-audit` / `blog-spanish-translation-gap` theme.
- Decomposable into: (a) `projects.json` + `/projects` rewiring, (b) `tasks.json` locale variants + route locale wiring, (c) filter-splice fix, (d) remaining locale translations. Started as one task per the PM request; split if it grows.
