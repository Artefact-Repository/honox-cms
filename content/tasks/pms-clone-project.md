---
title: PMS — Clone Project (mirror task clone + optional task cascade)
project: pms
status: Draft
priority: Medium
assignee: Mia Chen
dueDate: 2026-10-31
tags: [pms, projects, ui, clone]
---

## Why

`content/docs/PMS.md` (line 73) claims project "clone, delete" parity with tasks, but the code only has **task** clone (`cloneTask` in `app/utils/task-save.ts:203`, `TaskCloneDialog` in `app/islands/task-clone-dialog.tsx`). Projects can't be cloned — `app/utils/project-save.ts` has only `createProject`, no `cloneProject`. This task closes that gap and makes the doc's parity claim true (it's currently part of the doc-drift we track in `pms-doc-code-drift-sync`).

## Approach — mirror the proven task-clone pattern

The task clone path is the template; replicate it for projects:

1. **`cloneProject(slug, newTitle)` in `app/utils/project-save.ts`.** Mirror `cloneTask` (task-save.ts:203-233):
   - `requireToken()` (git-token gated, same as everything in PMS).
   - Fetch source `content/projects/<slug>.*`, `parseFrontmatter`.
   - `slugify` the new title and retry with a numeric suffix (`-2`, `-3`, …) on collision — reuse the exact `fileExists` loop convention `cloneTask` already uses (also referenced by `pms-llm-bulk-preview-review` / `pms-llm-batch-commit` as the precedent to keep consistent).
   - `stringifyFrontmatter({ ...data, title: newTitle }, content)` and `createFile` with a commit message like `Clone project "<src>" as "<new>"`.
   - Return the new slug.
2. **`ProjectCloneDialog` in `app/islands/project-clone-dialog.tsx`.** Port `TaskCloneDialog` (task-clone-dialog.tsx): controlled dialog, prefill `${title} (Copy)`, validate non-empty, call `cloneProject`, `toaster.success/error`, commit-to-main copy. Reuse the same `Dialog` body/cancel/confirm slot pattern (don't use bare `children`).
3. **Mount point — `ProjectActionsMenu`.** The Clone entry belongs in the same actions menu that `pms-delete-project` introduces (it adds `ProjectActionsMenu` + the project listing/detail mount). **Soft dependency:** sequence this after `pms-delete-project`, or have this task create its own menu if delete hasn't shipped yet — but preferable to share one menu so projects get a single "…" affordance like tasks do (`TaskActionsMenu` at `app/islands/task-actions-menu.tsx:107`).
   - List-page trigger: mirror `app/islands/task-clone-action.tsx` (the table's click-delegated trigger) if a projects table exists.

## Decisions to settle in the PR

- **What fields reset on clone.** Keep `owner`, `colorPalette`, `tags`, `description`. Recommend: reset `status` to `"Active"` (a copy of an archived project is presumably being reactivated) and set `startDate` to today; decide whether to keep or clear `dueDate`. Don't carry `Archived` status forward.
- **Clone its tasks? (the meatier option).** A project clone is most useful as a *template* — offer an opt-in "also clone N tasks" toggle (default **off**, mirroring the opt-in cascade in `pms-archive-project-task-cascade`). If on: `listTasksByProject(sourceSlug)` (tasks.ts:164) → for each task, copy its file with the `project` field rewritten to the new slug, applying the same slug-collision suffix logic. One commit for the project + its tasks (reuse the `createFiles`-once pattern from `pms-llm-batch-commit`). If left off, the cloned project simply starts with zero tasks.
- **Doc.** Once shipped, update `content/docs/PMS.md` so the per-collection breakdown (in `pms-doc-code-drift-sync`) reads "projects: create + delete + edit + clone" — don't re-claim parity prematurely.

## Acceptance criteria

- `cloneProject(slug, newTitle)` creates a new project file with the source's fields (title overridden), handles slug collisions with `-N` suffixes, and commits to main token-gated.
- `ProjectCloneDialog` prefills `<title> (Copy)`, validates, toasts success/error.
- Clone is reachable from the project actions menu (listing and/or detail).
- Optional task cascade works when toggled, rewriting each cloned task's `project` field and avoiding slug collisions.
- `content/docs/PMS.md` reflects project clone as shipped behavior.

## Notes / dependencies

- Depends on `pms-delete-project` for the `ProjectActionsMenu` mount (or self-creates the menu).
- Pairs with `pms-doc-code-drift-sync` (makes the doc's clone claim accurate) and reuses the `cloneTask` slug-collision convention already cited by the LLM bulk-create tasks.
- No new dependencies; purely additive, mirrors existing code.
