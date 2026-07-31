---
title: Archived views — toggles, counts, and restore affordances on /projects and /tasks
project: pms
status: To Do
priority: Medium
assignee: Priya Nair
dueDate: 2026-10-31
tags:
  - pms
  - projects
  - tasks
  - ux
---

Once the data-layer (`pms-archive-data-layer`) hides archived items by default, the listings need a way to *reveal* them and restore — otherwise archive is a one-way trap. This task adds the Archived surface on both top-level listing pages.

## /projects — `app/routes/projects/index.tsx`
- The grid (line 169) now receives only non-archived projects from `listProjects()`. Add an **"Archived (N)"** toggle/segmented control in the page header (near the `<Heading>` at line 147).
- When toggled on, call `listProjects({ includeArchived: true })` and filter to `status === "Archived"`, rendering them in a visually distinct "Archived" section (muted/de-emphasized cards) with a **Restore** button per card that calls the unarchive action from `pms-archive-project-ui`.
- Show the archived count in the toggle label.

## /tasks + board — `app/routes/tasks/index.tsx` and `app/islands/task-board.tsx`
- The `/tasks` page already has a status-filter pattern (it `loadPage("tasks")` and injects a status filter). Extend the filter set with an **"Archived"** option that switches the query to `listTasks({ includeArchived: true })` filtered to `archived === true`.
- The board (`task-board.tsx`) should offer the same: an "Archived" view showing archived cards, each with a **Restore** action (reuse the unarchive control from `pms-archive-task-ui`).
- Archived tasks in these views should read "archived N days ago" from `archivedAt` where helpful.

## Acceptance
- Toggling "Archived" on either page reveals only archived items, with a Restore control on each.
- Restoring moves the item back into the default (non-archived) view immediately after reload.
- Archived counts are accurate and shown in the toggle labels.
- Default (untoggled) views never show archived items — confirms the data-layer filter works end-to-end.
