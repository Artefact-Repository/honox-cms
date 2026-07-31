---
title: CMS Page Builder
summary: "Harden, complete, and showcase the Sveltia-CMS-backed Page Builder:
  close the stored-XSS risk in its raw-JS escape hatches, finish i18n coverage
  of CMS pages, and make the dynamic data-binding feature actually used."
status: Active
colorPalette: teal
owner: Diego Ramos
startDate: 2026-08-01
dueDate: 2026-10-31
tags:
  - cms
  - page-builder
  - security
  - i18n
---

Improvement programme for the CMS-driven Page Builder (`content/pages/*.json` → `PageRenderer`/`page-registry.tsx`, `content/configs.json` `headerItems`, and `public/admin/config.yml` schema). The builder is the most capable surface on the site — 40+ block types, recursive nesting, a data-source binding layer (`each`/`dataSource`), live JSON-preview playground, and CMS-editable headers — but has three soft spots:

1. Its "advanced escape hatches" (Button Custom `onClick`, Field/Textarea Validator via `new Function`, raw `<script>` block, raw SVG icon) are deliberately unsanitised, so any CMS writer can execute arbitrary JS in readers' browsers.
2. Only 4 of 11 CMS pages are translated per locale, so half the page-builder surface is English-only on a site that advertises six locales.
3. The dynamic data-source feature (`projects`/`taskAssignees`/`taskStatuses`/`taskPriorities` resolvers) is wired but exercised by a single page (`tasks.json`).

**Goal:** a page builder that is safe to open to editors, fully localised, and visibly data-driven.
