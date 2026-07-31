---
title: Archive/unarchive projects from the UI (depends on project actions menu)
project: pms
status: To Do
priority: Medium
assignee: Diego Ramos
dueDate: 2026-10-31
tags:
  - pms
  - projects
  - ux
  - engineering
---

Wire Archive / Unarchive for projects. Projects currently have **no actions menu at all** and `app/utils/project-save.ts` implements **only `createProject`** (no `updateProject`) — so this task **depends on `pms-delete-project`**, which introduces `updateProject` and a `ProjectActionsMenu`. Do not start this until that lands.

## What to build (once `updateProject` + `ProjectActionsMenu` exist)
- Add **Archive** / **Unarchive** to the `ProjectActionsMenu` on:
  - the `/projects` listing — `app/routes/projects/index.tsx` (project cards rendered at line 169; the `Badge` at line 196 shows `project.status`).
  - the project detail page — `app/routes/projects/[slug].tsx`.
- Archive = `updateProject(slug, (data) => ({ ...data, status: "Archived" }))`, reusing the **pre-existing `ProjectStatus` `"Archived"`** value (`app/lib/projects.ts:21,28`) and its `PROJECT_STATUS_COLOR["Archived"]` (line 36). No new field.
- **Unarchive should restore the project's real prior status**, not blindly reset to "Active". Recommend storing the last non-archived status in a `preArchiveStatus` field on archive, then writing it back on unarchive — so an archived "Completed" project returns to "Completed", not "Active".

## Picker hygiene
- `PROJECT_STATUSES` (line 23) feeds the New Project status picker. **"Archived" should not be a selectable initial status** — it's a transition target. Filter it out of the *creation* dropdown (leave it in the type + color map so updateProject can set it).

## Gating
- Gate the action behind `useGitToken` (hide, don't disable) — same rule as `pms-permission-gating-review` and the task-ui archive task.

## Acceptance
- A project can be archived from its card menu and its detail page; it disappears from the default `/projects` grid (the data-layer now excludes `status === "Archived"`).
- Unarchive restores the prior (pre-archive) status exactly.
- "Archived" is not offered as an initial status in the create form.
- No project file is deleted.
