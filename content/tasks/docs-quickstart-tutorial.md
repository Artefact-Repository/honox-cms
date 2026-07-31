---
title: Write a "Build your first page" quickstart tutorial
project: documentation-website
status: To Do
priority: High
assignee: Diego Ramos
dueDate: 2026-08-27
tags:
  - docs
  - content
  - onboarding
---

Getting-Started is a command cheat-sheet (install / dev / build / deploy) — accurate but not a tutorial. A new user cannot currently go from `git clone` to a working custom page with a live embedded component in one sitting without reading Architecture end-to-end.

Author a focused quickstart as a new MDX doc under `content/docs/` (so it can embed live component demos). It should walk through: creating a new docs page, embedding a live `<Button>`/`<Card>` demo inline (the MDX pipeline already supports this), swapping the site accent via the one-line `app/theme/global-css.ts` edit, and deploying to Cloudflare Pages — the smallest end-to-end loop. Keep it under ~15 min of reading. Cross-link it from Introduction and the sidenav's Guides group (add to `docOrder` in `content/configs.json`).
