---
title: PMS — i18n for the Projects & Tasks UI
project: pms
status: Draft
priority: Medium
assignee: Mia Chen
dueDate: 2026-10-31
tags: [pms, i18n, ui, infrastructure]
---

## Why

The PMS (Projects & Tasks) surface is **currently English-only** — none of its routes call `detectLocale`, and every label, button, and heading is a hardcoded English string. That breaks the site's own promise: it advertises 6 locales (en/zh/pt/de/fr/es) and docs/blog/pages are all translated, but `/projects` and `/tasks` (and all their islands) render in English regardless of the visitor's locale. This is the same systemic i18n gap we already flagged for the Documentation, Blog, and CMS Page Builder projects — PMS is just the largest untranslated surface left.

Crucially, the app has **no shared UI-string dictionary**. Route-level (`app/lib/i18n.ts`) and content-level (`content/pages/<locale>/` via `loadPage`) i18n exist, but hardcoded chrome is done with ad-hoc literals (`currentLocale === "zh" ? "博客" : "Blog"`) or per-collection maps (`BLOG_SEARCH_STRINGS` in `app/routes/blog/by-author/[author].tsx`). PMS would be the natural place to introduce a proper string-map mechanism rather than copy that pattern again.

## Scope (what gets translated vs. not)

- **Translate the interface chrome only:** headings ("Projects", "Tasks"), buttons ("New Project", "Save", "Archive", "Delete"), column/section labels, filter labels, empty states, the create/edit/drawer copy.
- **Do NOT translate user-authored content** in `content/projects/*.md` / `content/tasks/*.md` (titles, descriptions, assignees) — that's operational data like a DB row. Only the *display* label of a status/priority is translated; the stored value stays English.

## Two decisions to make before coding (call out in the PR)

1. **String mechanism.** Introduce a small PMS string map (`app/lib/pms-i18n.ts` or fold into `app/lib/i18n.ts`): a `t(key, locale)` that looks up `{ en, zh, pt, de, fr, es }` and **falls back to `en`** for missing keys (matching the rest of the app's fallback convention). Seed `en` + `zh` fully; the other 4 locales can be stubbed with English fallbacks and filled later. Do NOT replicate the inline `currentLocale === "zh" ? ... : ...` ternary pattern — PMS has far too many strings for that to stay maintainable.
2. **Route-level locale prefixing.** Decide whether PMS pages get locale-prefixed URLs like docs/blog (`/[locale]/projects`, `/[locale]/tasks`) — which means adding `ssgParams`, wiring `detectLocale` in each route, and extending the `app/server.ts` redirect logic + `localiseHref` — **or** stay at the unprefixed path and only translate the in-page chrome (simpler; the URL doesn't change with locale). Recommend the simpler option for v1 and revisiting if PMS needs to be a first-class translated section.

## Concrete work

- **Status / priority / project-status labels** (`app/lib/tasks.ts:45` `TaskStatus`, `app/lib/projects.ts` `ProjectStatus`): add a `STATUS_LABELS` / `PRIORITY_LABELS` lookup keyed by the English value → `{ [locale]: string }`. Keep stored values English. Render via the lookup everywhere a raw status string is shown — notably `app/islands/task-status-filter.tsx:61-75` (currently `label: "To Do", value: "To Do"`), the task board columns (`app/islands/task-board.tsx`), and the detail/drawer headings. The color override path (`app/lib/pms-config.ts` `mergeColorOverrides`) stays untouched — it keys on the value, not the label.
- **Routes:** `app/routes/projects/index.tsx`, `app/routes/projects/[slug].tsx`, `app/routes/tasks/index.tsx`, `app/routes/tasks/[slug].tsx` — call `detectLocale(c.req.path)` (or accept the locale prop from the renderer), thread `currentLocale` into the islands.
- **Islands with English copy:** `task-board.tsx`, `task-details-drawer.tsx`, `task-create-drawer.tsx`, `task-row-actions-menu.tsx`, `project-create-drawer.tsx`, `task-subtasks.tsx` — route their visible strings through `t()`.
- **Locale switcher:** reuse the switcher chrome already built for CMS pages (`app/components/page-registry.tsx`'s `localeToggleUrl` / locale-toggle block) so PMS pages get the same language switch the rest of the site has.
- **Fallback:** any missing translation resolves to `en` (no blank UI, consistent with `loadPage`/`loadPosts` fallback behavior).

## Acceptance criteria

- Visiting `/projects` (or its locale-prefixed variant, per decision #2) with `locale=zh` shows translated headings/labels/buttons; untranslated `en` strings fall back gracefully.
- Status/priority badges show the translated label while the underlying `content/tasks/*.md` `status` value remains the English key (verify no content-file change needed).
- `app/lib/i18n.ts` (or the new map) is the single source of truth for PMS strings — no new inline `currentLocale === "x" ? ... : ...` literals introduced.
- Locale switcher present and functional on PMS pages.

## Notes / dependencies

- `app/lib/i18n.ts` already exports `detectLocale`, `isLocale`, `localiseHref`, `stripLocale`, `localeToggleUrl`, `TRANSLATED_LOCALES`, `ALL_LOCALES` — reuse, don't reinvent.
- Pairs naturally with the existing `docs-i18n-coverage-audit`, `blog-spanish-translation-gap`, and `cms-page-i18n-coverage` tasks — a shared i18n-infra fix here could pay off across all three.
- Could be decomposed later into: (a) string-dictionary + labels, (b) route wiring + switcher, (c) the 4 remaining locale translations. Started as one task per the PM request.
