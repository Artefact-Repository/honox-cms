---
title: PMS (Projects & Tasks)
summary: Make the Git-backed Projects & Tasks surface a complete management tool
  — add project delete/edit, bring the /projects listing to search/filter parity
  with /tasks, and fix the orphaned-task and doc-drift gaps.
status: Active
colorPalette: orange
owner: Priya Nair
startDate: 2026-08-01
dueDate: 2026-11-15
tags:
  - pms
  - projects
  - tasks
  - engineering
---

Improvement programme for the PMS (Projects & Tasks) surface: app/routes/projects/* and app/routes/tasks/*, backed by content/projects/*.md and content/tasks/*.md, with direct-to-git writes via app/utils/project-save.ts and app/utils/task-save.ts (see content/docs/PMS.md). The PMS is both a real tracker and the repo's showcase of the 'content-as-files → CMS edits → SSG renders' pattern. Tasks get a full lifecycle (create, edit, clone, delete, convert, drag-to-status, inline edit); projects get only create — there is no deleteProject/updateProject in app/utils/project-save.ts, no ProjectActionsMenu, and the /projects listing has no search/filter (unlike /tasks and /projects/:slug). Deleting a project also orphans every task whose project field still points at its slug. The PMS doc (content/docs/PMS.md, line 73/92) already describes clone/delete parity across both collections, so it currently over-claims what projects can do. Goal: projects reach the same mutation parity as tasks, the /projects listing becomes searchable/filterable, deleting a project safely handles its tasks, and the doc stops claiming parity it doesn't yet have.
