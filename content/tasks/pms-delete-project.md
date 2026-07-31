---
title: Add a Delete Project action (projects are create-only today)
project: pms
status: To Do
priority: High
assignee: Mia Chen
dueDate: 2026-09-15
tags:
  - pms
  - projects
  - engineering
---

There is no way to delete a project from the UI. Tasks have a full `TaskActionsMenu` (Edit / Clone / Convert / Delete) and a `TaskDeleteDialog`, but projects only have `ProjectCreateDrawer` — `app/utils/project-save.ts` implements **only `createProject`** (lines 31-59), with no `deleteProject` and no `updateProject`. The `/projects` listing (`app/routes/projects/index.tsx`) and the project detail page (`app/routes/projects/[slug].tsx`) mount `PmsCreateMenu` only; neither has a project actions menu or a delete button. This is the single biggest missing action in the PMS and was explicitly called out as the first thing to add.

Mirror the task pattern end-to-end:

1. **`app/utils/project-save.ts`** — add `deleteProject(slug)` mirroring `deleteTask` in `app/utils/task-save.ts`: import `fetchFile` + `deleteFile` from `./git-backend` (currently only `createFile`, `fileExists`, `requireToken` are imported) and do `requireToken()` → `fetchFile('content/projects/${slug}.json', token)` → `deleteFile(path, file.sha, 'Delete project "${slug}"', token)`.
2. **`app/islands/project-delete-dialog.tsx`** — new dialog mirroring `app/islands/task-delete-dialog.tsx` (red confirm button via `colorPaletteClass("red")`, `role="alertdialog"`, commit-message toast "Committed to main — live once the site rebuilds."). On delete, navigate to `/projects` (same as `TaskDeleteDialog`'s `onDeleted` redirect to `/tasks`).
3. **`app/islands/project-actions-menu.tsx`** (or a minimal delete button) — mirror `app/islands/task-actions-menu.tsx`'s ellipsis `Dropdown` trigger, with at least a Delete item (and an Edit link to `/admin/#/collections/projects/entries/${slug}`, matching the task menu's `editHref`). Mount it in the nav of `app/routes/projects/[slug].tsx` (next to `PmsCreateMenu`, line ~179) **and** on each project card in `app/routes/projects/index.tsx` (the listing — this is the primary requested location), reusing the same delegated-trigger / singleton-island pattern the tasks table uses so it hydrates correctly inside the grid.

All of it must be gated behind `useGitToken()` (from `app/islands/git-token-banner.tsx`): when there's no token the button must not render at all, exactly like `PmsCreateMenu` returns `null`. The write path already goes straight to `main` via `git-backend.ts`, so no server endpoint is needed — same as task delete.

Once this lands, update `content/docs/PMS.md` (see the doc-drift task) since it already claims project delete parity.
