---
title: Add an Edit affordance for projects (today they're read-only except /admin)
project: pms
status: To Do
priority: Medium
assignee: Priya Nair
dueDate: 2026-10-15
tags:
  - pms
  - projects
  - engineering
---

Projects are currently display-only in the app. The task detail page (`app/routes/tasks/[slug].tsx`) mounts a `TaskActionsMenu` whose `editHref` deep-links into the CMS (`/admin/#/collections/tasks/entries/${task.slug}`), and tasks also support true inline edit (`TaskEditableText`, `TaskProjectEditor`). Projects have **no actions menu at all** — `app/routes/projects/[slug].tsx` mounts only `PmsCreateMenu` (line ~179) — so the only way to change a project's title, status, owner, dates, or description is to know to open `/admin`. There is also no `updateProject` in `app/utils/project-save.ts`, so inline edits can't persist even if the UI existed.

Two-stage delivery:

1. **Edit link + actions menu (must-have).** Add a `ProjectActionsMenu` to `app/routes/projects/[slug].tsx` (and ideally each card on the `/projects` listing) mirroring `app/islands/task-actions-menu.tsx`, with an **Edit** item whose `editHref` is `/admin/#/collections/projects/entries/${slug}` (matching the task pattern). This alone closes the discoverability gap.
2. **Inline edit (stretch).** Add `updateProject(input)` to `app/utils/project-save.ts` (mirror `updateTask` in `app/utils/task-save.ts`: fetch → patch JSON → `updateFile` with the blob SHA). Then build a `ProjectEditDrawer` reusing `ProjectCreateDrawer`'s form (`app/islands/project-create-drawer.tsx`) but calling `updateProject` and prefilled from the project's current fields (title, summary, description, status, colorPalette, owner, startDate, dueDate, tags). This gives projects the same inline-edit parity tasks already have.

All writes go through `git-backend.ts` and must stay gated behind `useGitToken()` — no token, no edit affordance — consistent with the create/delete paths.
