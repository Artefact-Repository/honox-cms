---
title: Sync content/docs/PMS.md with actual project mutation capabilities
project: pms
status: To Do
priority: Low
assignee: Diego Ramos
dueDate: 2026-11-15
tags:
  - pms
  - docs
  - engineering
---

`content/docs/PMS.md` currently over-claims what the PMS can do for projects, and the gaps this project is closing will drift it further if it isn't updated.

Specific drift today:
- **Line 73** describes "everywhere on `/projects` and `/tasks` that looks editable … clone, delete" as committing straight to `main` — implying project delete already exists. It doesn't: `app/utils/project-save.ts` only has `createProject`.
- **Line 92** lists `TaskCloneDialog` / `TaskDeleteDialog` (tasks only) under "Where this shows up" but no project equivalents, while the surrounding prose (line 73) implies project parity. The doc is internally inconsistent about whether projects can be deleted.
- **Line 103** documents search on `/tasks` and `/projects/:slug` but not the `/projects` listing — which is accurate today (the listing has no search) but will be wrong once the search/filter task lands.

Action: once the Delete Project, Edit project, and Project search/filter tasks ship, update the doc to be the single source of truth:
- List `ProjectDeleteDialog` / `ProjectActionsMenu` (and `ProjectEditDrawer` if built) in "Where this shows up", mirroring the task entries.
- Replace the broad "clone, delete" claim with an accurate, per-collection breakdown (tasks: full lifecycle; projects: create + delete + edit once added).
- Add the `/projects` listing search/filter to the Search bullet (line 103).
- Keep the "Direct-to-Git Writes" section's token-resolution/backend notes intact — those are still correct and are the most valuable part of the doc.

Treat this as the close-out task for the PMS project: the doc should never describe a capability the code hasn't shipped.
