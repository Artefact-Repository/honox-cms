---
title: Document the Archive feature in content/docs/PMS.md (and avoid doc drift)
project: pms
status: To Do
priority: Low
assignee: Diego Ramos
dueDate: 2026-11-10
tags:
  - pms
  - docs
  - engineering
---

Document the Archive feature in `content/docs/PMS.md` so the doc describes what the code actually does — directly addressing the doc-drift we already flagged (`pms-doc-code-drift-sync`: the doc currently over-claims project clone/delete parity). Archive is new behavior the doc must capture, not pre-empt.

## What to document
- **Archive vs Delete** — archive flips a lifecycle flag and keeps the file in git (reversible); delete physically removes it. Both are git-token-gated writes.
- **Tasks** — archive via a `archived` boolean + `archivedAt` timestamp (separate from workflow `status`, which drives board columns). How to archive/unarchive from the row menu, detail drawer, full page, and board; default views exclude archived; the "Archived" filter reveals them.
- **Projects** — archive reuses the existing `status: "Archived"` value (no new field); restore returns the project to its prior status (not blindly to "Active"); "Archived" is not an initial status in the create picker.
- **Project→task cascade** — archiving a project preserves its tasks by default; opt-in "archive completed tasks" cascade.
- **Visibility model** — archived items are excluded from `listTasks()` / `listProjects()` unless `includeArchived` is passed; search (`app/utils/search.ts`) is blog-only and unaffected.

## Acceptance
- `content/docs/PMS.md` accurately describes archive/unarchive for both projects and tasks, the Archived project status, default visibility, and restore — matching the shipped behavior.
- No claim is made about functionality not implemented (the drift we keep catching).
