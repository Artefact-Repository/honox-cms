---
title: "[Docs] Contentise /docs and /docs/[doc] via CMS bindings (remove route chrome)"
project: documentation-website
status: Draft
priority: Medium
assignee: Sam Okafor
dueDate: 2026-09-15
tags: [docs, content-extraction, cms, page-builder, bindings]
---

## Why

The docs surface is the last big hand-written page on the site. `app/routes/docs/index.tsx` and `app/routes/docs/[doc].tsx` (~1100 lines combined) hand-render the shell, the grouped sidenav, the landing card grid, the doc meta badges, the markdown body mount, and the prev/next pager. Goal: express the **entire** page as `content/pages/docs.json` + `content/pages/docs/[doc].json` using CMS bindings/APIs (data sources + bound block types), and remove as much TSX as possible — the routes should shrink to thin data-binders.

This is the "docs" test case for the same bindings end-state spelled out in `pms-i18n.md` ("recreate the features with CMS bindings/APIs"): if the docs surface — the most chrome-heavy pages in the app — can be fully content-declared, the pattern is proven.

## What's already CMS (grounded)

- **Header** on both pages is already 100% CMS: `config.header` (the `DocsConfig` singleton, CMS-edited) rendered via `renderBlocks` with `locale`/`currentPath` — including the search box and locale dropdown.
- **Landing hero/intro** already comes from `loadPage("docs", locale)` → `<PageRenderer>` (docs/index.tsx:340,385).
- `config.groups` / `docOrder` / `fallbackLabel` (sidenav structure), `config.links`, `config.headerItems`, `config.docsUi` (pager labels etc.), `config.hydrationTiers`, `config.collections` — all CMS-editable via configs.json, per-locale.
- **The `layout` block type already exists** in the registry (`page-registry.tsx:1218`) and renders the full `Layout` shell with `header`/`sider`/`content`/`footer` **block-list slots** — so the docs shell itself can be content-declared today, no new shell machinery needed.

## What's still hardcoded (the removal list)

| Hardcoded in the route | CMS binding to replace it |
|---|---|
| Landing card grid (`docs.map` → Card, index.tsx:398-424) | `each` block over a new `dataSource: "docs"` + a card template (title/href/category via `{{item.*}}`) |
| `DocsSidenav` (grouped collapsible nav + links, both routes) | New bound block type `docsSidenav` (options/active state resolved server-side; the scroll-into-view script at `[doc].tsx:600-606` moves into this island) |
| Detail title `<h1>` + category/hydration-tier badges (`[doc].tsx:617-648`) | Content `heading` block + new bound `docMeta` block (badges from `doc.category` / `doc.hydration` + `config.hydrationTiers` labels) |
| Markdown body mount (`doc.Component` / `doc.html` + `markdownContentClass`, `[doc].tsx:650-659`) | New bound `docBody` block (renders the existing remark/rehype output for the current slug) |
| Prev/next pager (`DocPager`, `[doc].tsx:661-667`) | New bound `docPager` block (prev/next from the flattened sidenav order; labels from `docsUi`) |
| Shell props (`docsShellProps` + `<Layout …>`) | Top-level `layout` block in the page JSON (header/sider/content slots) |

## Component inventory — the routes must stop importing `components/ui`

End-state: `docs/index.tsx` and `docs/[doc].tsx` import **zero** UI components and **zero** icons — only loader/data helpers and the render primitive. Every component they import today has a binding replacement:

| Component imported today | Replacement binding |
|---|---|
| `Layout` + `docsShellProps` (both routes) | `layout` block (registry :1218); shell styling → `layout` **recipe variant** (Design step 7) |
| `Card`, `Text` — landing grid (index.tsx:398-424) | `each` block + card/link/text template blocks (already exist) |
| `Collapsible` + `ChevronDownIcon` — sidenav groups (both routes) | `docsSidenav` bound block (island owns the disclosure + icon + scroll-into-view script) |
| `Anchor` — nav links / pager links / grid cards | `link` block (exists) / inside `docsSidenav` / `docPager` |
| `Heading`, `Badge`, `Stack` — detail title + meta badges (`[doc].tsx:617-648`) | content `heading` + `stack` blocks (exist) + `docMeta` bound block |
| `ArrowLeftIcon`, `ArrowRightIcon` — pager | `docPager` bound block |
| `GitHubIcon`, `ExternalLinkIcon` — links cluster (both routes) | rendered inside `docsSidenav` |
| `AuthStatus` (both routes) | `authStatus` block (exists); the per-doc `withDocEditHref` patch stays server-side |
| `markdownContentClass` div — body mount (`[doc].tsx:650-659`) | `docBody` bound block |
| `renderBlocks` / `PageRenderer` | the ONE render primitive the thin loader keeps |

Target import list for both routes: `createRoute`, `ssgParams` (detail only), `loadDocs` / `loadDocBySlug`, `loadPage`, `detectLocale` / `isLocale` / `localiseHref`, `renderBlocks` (or `PageRenderer`), and `c.notFound()` — **nothing from `../../components/ui`, no icons, no `markdown-content-style`**.

## Design

1. **`content/pages/docs.json`** (landing): top-level `layout` block → `header` (config.header blocks), `sider` (`docsSidenav`), `content` (existing hero blocks + an `each` block with `dataSource: "docs"` for the card grid). Keep the existing locale variants (`content/pages/<locale>/docs.json`) in sync.
2. **`content/pages/docs/[doc].json`** (detail): a **data-driven template page**, resolved per slug — NOT hand-authored per doc (there are hundreds of `.mdx` docs; per-doc files at `content/pages/docs/<slug>.json` would be unmaintainable duplication). Template = top-level `layout` block with `header`/`sider`/`content` where content = `heading` (doc.title via binding), `docMeta`, `docBody`, `docPager`. The route resolves the template and binds the current doc into it.
3. **New bound block types** (registry `page-registry.tsx` **and** `public/admin/config.yml`, so CMS editors can compose them): `docsSidenav`, `docMeta`, `docBody`, `docPager`. Land with `cms-registry-schema-drift-ci` so the registry ↔ schema additions are guarded.
4. **New data source** `docs` in `app/lib/data-sources.ts` (alongside `projects`/`taskStatuses`…): returns `loadDocs(locale)` as `DataSourceItem`s (`label: title`, `value: slug`, `href: /docs/<slug>`, plus `category`/`section` for template display).
5. **API seam — per-request page context:** `renderBlocks` already forwards `locale`/`currentPath` extras (page-registry.tsx:448 comment). Add a `doc`/`activeSlug` extra so `docBody`/`docPager`/`docsSidenav` can resolve the current doc without per-block props — the same seam the PMS bindings section proposes. `DataSourceContext` may also need `locale` (it currently only carries `currentUrl`).
6. **Routes shrink to thin loaders:** `docs/index.tsx` → `loadDocs` + `loadPage("docs", locale)` + render (or served via the generic page route with an alias); `docs/[doc].tsx` → `ssgParams(loadDocs)` + `loadDocBySlug` + `loadPage(docTemplate, locale)` + bind doc context + `renderBlocks`, keeping `detectLocale`, `localiseHref`, `isLocale` guard, and `c.notFound()`.
7. **Shell styling → `layout` recipe variant (the one styling boundary).** The `layout` block passes JSON-able props into `<Layout>`; the css()-object styling in `docsShellProps` (glass header, `bodyClass` max-width/padding, `siderClass` top/maxH) can't be authored as JSON block props. Bake it into a `layout` recipe variant (e.g. `variant="docs"`) so the block simply sets `variant: "docs"` — static, JSON-expressible, and consistent with the recipe-variant approach in `cms-static-css-presets`. **`docsShellProps` is deleted.**
8. **i18n rides along:** doc bodies are already per-locale (`.mdx` in `content/docs/<locale>/`); the template chrome is mostly bound/config-driven so there's little to translate; landing locale variants already exist.

## Honest boundaries — what cannot be removed (flag in the PR)

- **The route file stays** — something must map `/docs/[doc]` → content + data. The goal is removing *chrome*; the loader (~30-50 lines: ssgParams, locale, 404, binding) remains TSX.
- **Shell styling (`docsShellProps` css objects) can't be JSON-authored** — it moves into a `layout` recipe variant (`variant="docs"`), not into content; `docsShellProps` is deleted, never migrated to inline styles.
- **`withDocEditHref`** (`[doc].tsx:324-341`): the per-doc admin Edit deep-link can't be authored in CMS (the CMS doesn't know which doc the reader is on). Stays server-side, or becomes an `authStatus` binding resolution. Do not try to force it into content.
- **The `.mdx` body + remark/rehype pipeline** (`app/utils/markdown.ts`, `markdown-content-style.ts`): authored content stays; only its *mount point* becomes a block.
- **Shell chrome source decision:** `config.header`/`headerItems`/`links` are already CMS (configs.json singleton). Decide whether they migrate into the page's `layout` block (unified per-page content) or stay config-driven (shared across both docs pages — my recommendation: keep config, it's already CMS-editable and shared).

## Acceptance criteria

- `/docs` and `/docs/[doc]` render fully from `content/pages/docs.json` + the `docs/[doc].json` template + bound blocks — routes contain **no visible chrome literals**, only data binding.
- **The two route files import zero `../../components/ui` components and zero icons** — imports limited to loader/data helpers + render primitive (see Component inventory).
- **`docsShellProps` deleted**; shell styling lives in a `layout` recipe variant; rendered HTML visually identical.
- Rendered HTML matches current output (visual regression over all docs + every locale): sidenav grouping/order/active state, landing grid, badges, body, pager all identical.
- Locale detection/prefix, `localiseHref`, 404s, and `ssgParams` output unchanged.
- New block types present in both `page-registry.tsx` and `config.yml` (CI guard passes); `docs` data source resolves under SSG.
- Measurable line reduction in the two routes (target: chrome removed, loaders only).

## Decisions to settle in the PR

- **Per-doc template vs. per-doc files** (`content/pages/docs/[doc].json` as a resolved template — recommended — vs. a file per doc slug).
- **Shell chrome**: keep `config.header` as the shared source, or fold into the page `layout` block.
- **Shell styling**: `layout` recipe variant (`variant="docs"`) vs. keeping `docsShellProps` — recommended: recipe variant (JSON-expressible, static-CSS-safe).
- **Doc-context seam**: page-context extras on `renderBlocks` vs. an explicit slug prop on the bound blocks.
- **Block-type ownership**: the new `docs*` block types + `docs` data source are Page Builder infra — land them under `cms-page-builder` or here. (Recommend: infra here is fine since it's docs-specific, but coordinate.)

## Notes / dependencies

- Files: `app/routes/docs/index.tsx`, `app/routes/docs/[doc].tsx` (thin out), `content/pages/docs.json` + `<locale>/docs.json` (layout + each grid), `content/pages/docs/[doc].json` (new template), `app/lib/data-sources.ts` (`docs` resolver + locale in context), `app/components/page-registry.tsx` + `public/admin/config.yml` (4 new block types), `app/lib/pages.ts` (page-context extras), `app/utils/markdown.ts` / `markdown-content-style.ts` (unchanged).
- Pairs with: `pms-i18n.md`'s bindings section (same end-state), `cms-datasource-showcase` (the `each`/`dataSource` grid pattern), `cms-registry-schema-drift-ci` (registry ↔ config.yml), `cms-static-css-presets` (use token-mapped presets, no raw `style` strings in the new content).
- Note: Sam Okafor owns Documentation Website and is already the heaviest-loaded owner (7 tasks) — if this lands, consider rebalancing one of his lower-priority docs tasks.
