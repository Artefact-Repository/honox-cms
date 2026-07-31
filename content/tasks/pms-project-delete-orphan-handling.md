---
title: Handle tasks orphaned when their project is deleted
project: pms
status: To Do
priority: Medium
assignee: Priya Nair
dueDate: 2026-11-01
tags:
  - pms
  - projects
  - tasks
  - engineering
---

Deleting a project as specced in the Delete Project task will remove `content/projects/${slug}.md`, but every task that belongs to it keeps a dangling reference: a task's `project` field is the project slug as a plain string (a Sveltia `relation` widget resolved to `{{slug}}`, see `content/docs/PMS.md` and `app/lib/tasks.ts`), and `listTasksByProject(projectSlug)` just filters `task.project === projectSlug`. After the delete, those tasks still render under a project that no longer exists — the project detail page would 404, board/list filters by that project return empty, and any "View project →" link (e.g. `app/routes/tasks/[slug].tsx` line ~226) dangles.

Make delete safe before it ships:

1. **Count first.** In `ProjectDeleteDialog` (the new dialog from the Delete Project task), call `listTasksByProject(slug)` and show how many tasks reference the project, e.g. "Deleting this will leave N tasks pointing at a missing project."
2. **Offer a resolution.** At minimum, block delete (or require an extra confirm) when `N > 0`; ideally offer to reassign those tasks to another project (a project picker populated from `listProjects()`) or bulk-archive them, committing each reassigned task via `updateTask`/`saveTaskField` in `app/utils/task-save.ts` with a descriptive commit message.
3. **Tolerate the dangling state regardless.** Ensure `app/lib/tasks.ts` consumers (board, list, `by-project` route) don't crash when a task's `project` slug resolves to no project — render an "Unknown project" badge or filter it out gracefully — so historical/partial states never hard-fail.

This is the correctness companion to the Delete Project feature: without it, delete trades one missing file for N broken task references.
