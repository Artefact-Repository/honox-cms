---
title: Bring the /projects listing to search/filter parity with /tasks
project: pms
status: To Do
priority: Medium
assignee: Diego Ramos
dueDate: 2026-10-01
tags:
  - pms
  - projects
  - engineering
---

The `/projects` listing (`app/routes/projects/index.tsx`) is a static grid of cards with **no search box and no status filter**. Every other task surface has both: `/tasks` (`app/routes/tasks/index.tsx`) renders a `Search` island (`src="/api/tasks/search.json"`) plus a `TaskStatusFilter`, and the project **detail** page (`app/routes/projects/[slug].tsx`) also renders a `Search` island over its tasks. `content/docs/PMS.md` (line 103) even documents search as available on `/tasks` and `/projects/:slug` — but not on the `/projects` listing, so the listing is the odd one out and gets unwieldy as the project count grows.

Bring the listing to parity:

1. **Search** — reuse the existing `Search` island (`app/components/ui`) and the `filterEntries` / `buildHaystack` utilities (`app/utils/search.ts`) already used by tasks/blog/docs. For projects there's no `/api/projects/search.json` yet; either add one mirroring the tasks search endpoint (enumerating `listProjects()` and building entries from title/summary/tags/owner), or do an in-memory filter like `/projects/:slug` does with `buildHaystack` + `filterEntries` over the already-loaded `projects` array, keeping the server-side `?q=` fallback for no-JS.
2. **Status filter** — add a `ProjectStatusFilter` mirroring `app/islands/task-status-filter.tsx` but driven by `PROJECT_STATUSES` from `app/lib/projects.ts` (Planning / Active / On Hold / Completed / Archived), filtering the grid client-side and via a shareable query string.

Keep the same visual pattern as `/tasks` (search left, filter right, both inside the sticky header). This is a pure-UX win with no new persistence concerns — projects are still read-only here; this only affects how the existing list is surfaced.
