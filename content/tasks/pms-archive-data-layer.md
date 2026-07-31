---
title: Archive data layer — archived flag for tasks, Archived-status filtering for projects
project: pms
status: To Do
priority: High
assignee: Priya Nair
dueDate: 2026-09-30
tags:
  - pms
  - tasks
  - projects
  - engineering
---

Archive must be a **lifecycle state, independent of workflow status** — and it must be safe-by-construction: archiving flips a flag, it never `deleteFile`s the content (unlike the `pms-delete-project` / task-delete patterns, which physically remove the file from git). That separation is the whole point: archived items stay in the repo, recoverable, and never orphan anything.

This task is the foundation every other archive task builds on. Two halves because tasks and projects model status differently:

## Tasks — add a dedicated `archived` flag (do NOT reuse `status`)
`app/lib/tasks.ts`:
- Add `archived?: boolean;` and `archivedAt?: string;` to the `Task` interface (around line 55-73, after `excerpt`).
- In `buildTask` (lines 88-106) read `data.archived` / `data.archivedAt` into the object.
- Change `listTasks()` (line 119) to accept `options?: { includeArchived?: boolean }` and, by default, **exclude** tasks where `archived === true`. When `includeArchived` is set, return them.
- Thread the same option through `listTasksByProject` (line 143) and any other list entry points (e.g. `listTaskTree`/`subtasksOf` consumers get the already-filtered list upstream, so no change there).

Why a boolean and not a `status: "Archived"`: task statuses are board columns (`To Do` / `In Progress` / `In Review` / `Done` in `TASK_STATUS_COLOR`, lines 41-46). Adding an Archived status would pull archived tasks into a board column and lose their real workflow state. A separate flag keeps the two axes orthogonal.

## Projects — reuse the existing `Archived` status (no new field)
`app/lib/projects.ts` already defines `ProjectStatus` with an `"Archived"` value (lines 16-29) and a `PROJECT_STATUS_COLOR["Archived"]` (line 36) — it's a dormant enum, currently used by nothing in the UI.
- In `listProjects()` (line 96) accept `options?: { includeArchived?: boolean }` and, by default, **exclude** `status === "Archived"`. Return them when `includeArchived` is set.
- Do **not** add a separate `archived` boolean to projects — reusing the enum avoids two ways to express "archived" and keeps the status picker honest.

## Acceptance
- Default `listTasks()` / `listProjects()` exclude archived items everywhere they're consumed (board, `/tasks`, `/projects` grid, project progress counts in `projects/index.tsx:27`).
- Passing `includeArchived: true` returns them.
- `archivedAt` is recorded on archive so views can show "archived N days ago" and sort.
- No content file is deleted by any path introduced here.
