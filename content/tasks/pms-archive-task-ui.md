---
title: Archive/unarchive tasks from the UI (row menu, drawer, detail, board)
project: pms
status: To Do
priority: High
assignee: Mia Chen
dueDate: 2026-10-15
tags:
  - pms
  - tasks
  - ux
  - engineering
---

Wire Archive (and Unarchive) actions for tasks into every surface that already edits them, reusing the existing `saveTaskField` commit path. Archive is **non-destructive** — it sets `archived: true` + `archivedAt`, it does NOT call `deleteTask`.

## Surfaces to add the action to
- **Tasks table "..." menu** — `app/islands/task-row-actions-menu.tsx`. Add an `archive` / `unarchive` item to the `items` array (lines 223-257), next to "Edit in CMS" / "Convert to…". On select (in `handleSelect`, line 200) call `saveTaskField` exactly like `applyMove` (line 159) does:
  ```ts
  await saveTaskField(slug, (data) => ({
    data: { ...data, archived: true, archivedAt: new Date().toISOString() },
  }));
  ```
  Unarchive strips `archived` / `archivedAt`. Toast + `window.location.reload()` to reflect (same pattern as the move action).
- **Task detail drawer (quick view)** — `app/islands/task-details-drawer.tsx`. Add an Archive button in the drawer header/footer area (the drawer already renders `task.title` at line 85 and a footer at line 87).
- **Task full page** — `app/routes/tasks/[slug].tsx`, where `TaskActionsMenu` is mounted. Add Archive there too so it's reachable from the dedicated page.
- **Board cards** — `app/islands/task-board.tsx` (card title at line 200, badge at 217). Add an Archive action to the card's existing hover/menu affordances.

## Behavior
- Show **Archive** when `!task.archived`, **Unarchive** when `task.archived` (the data-layer flag, `app/lib/tasks.ts`).
- Archive needs **no confirm dialog** (it's reversible, unlike Delete which uses `TaskDeleteDialog`) — a success toast is enough. Unarchive is the same.
- **Gate behind `useGitToken`** — if the user has no git token, hide the action (don't just disable). This is the same gating rule called out in `pms-permission-gating-review`.
- Honour the data-layer default: archived tasks disappear from board/table/tree automatically because `listTasks()` now excludes them; archived tasks only reappear via an `includeArchived` view (see `pms-archive-listings-views`).

## Acceptance
- Archiving a task removes it from the board, table, and tree immediately after reload, with a toast.
- Unarchiving restores it to its prior column/position.
- No task file is deleted; `archivedAt` is set on archive and cleared on unarchive.
- Without a git token, no Archive/Unarchive control is visible.
