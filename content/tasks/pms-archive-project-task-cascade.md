---
title: Archiving a project — decide task cascade (preserve by default, opt-in archive of completed)
project: pms
status: To Do
priority: Medium
assignee: Mia Chen
dueDate: 2026-11-05
tags:
  - pms
  - projects
  - tasks
  - engineering
---

Archiving a **project** forces a decision about its **tasks**, and the right call is different from deleting a project (see `pms-project-delete-orphan-handling`, which *orphans* tasks on delete). Archive is non-destructive, so the default must preserve.

## Decision (recommended)
- **Default: archive the project only.** Its tasks are left untouched and remain associated (`task.project === projectSlug`). They keep showing in `/tasks` and the board under their normal status — archiving the parent is not a reason to hide active work. This is the safe, least-surprising behavior and avoids accidental mass-hiding.
- **Opt-in cascade:** in the project archive confirm dialog, offer a checkbox **"Also archive completed tasks"**. When checked, bulk-set `archived: true` (with `archivedAt`) on that project's tasks whose `status === "Done"` via batched `saveTaskField` / a single git commit (mirror the batched-commit pattern in `pms-llm-batch-commit`). Non-done tasks are never auto-archived.
- **Unarchive a project does NOT auto-unarchive tasks** — a task archived via the cascade stays archived until individually restored (or via a matching "restore archived tasks" checkbox, stretch).

## Why not auto-archive everything
Archiving is meant for *completed or outdated* projects. Their open tasks may still be relevant (carried into a successor project, or reopened). Mass-archiving them would silently drop in-flight work from the board — worse than the problem we're solving. Preserve by default; let the user opt into the completed-task cascade.

## Acceptance
- Archiving a project leaves its tasks visible and associated by default.
- With the cascade checkbox on, only `Done` tasks get `archived: true`; others are untouched; the change ships in one commit.
- No task is orphaned (contrast: delete orphans, archive preserves).
- Unarchiving the project never touches task `archived` flags unless the user explicitly restores them.
