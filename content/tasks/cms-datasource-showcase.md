---
title: Showcase the data-source binding on more pages
project: cms-page-builder
status: To Do
priority: Medium
assignee: Priya Nair
dueDate: 2026-09-30
tags:
  - cms
  - page-builder
  - content
---

The dynamic data-binding layer is built but barely used. `app/lib/data-sources.ts` exposes named resolvers — `projects`, `taskAssignees`, `taskStatuses`, `taskPriorities` — and `app/lib/pages.ts`'s `resolveBlockDataSources` wires an `each` block's `dataSource`/`items` + `template` (with `{{item.foo}}` placeholders) into rendered blocks. Yet only `content/pages/tasks.json` uses it; the other 10 pages are fully static JSON.

Prove out the differentiator: build a `content/pages/projects.json` (or enrich `index.json`/`about.json`) that binds a `projects` dataSource through an `each` template to render a live project grid, optionally with `taskStatuses`/`taskPriorities` badges. This demonstrates the builder is data-driven rather than a static mock, and exercises the resolver / `customTableDataResolvers` path beyond the one existing page. Mirror any new page into the translated locales per the i18n task.
