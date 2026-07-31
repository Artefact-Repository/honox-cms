---
title: "[LLM Assist] AI execution assist on the task detail page"
project: pms-llm
status: To Do
priority: Medium
assignee: Mia Chen
dueDate: 2027-01-31
tags:
  - pms
  - ai
  - local-inference
  - tasks
---

Add the second half the user named ("execution"): local-LLM help that turns a task into actionable output, committed through the existing git path. Target `app/routes/tasks/[slug].tsx` — the task detail page, which already mounts `TaskActionsMenu` (Edit / Clone / Convert / Delete) in its nav.

Add an "AI assist" menu (or buttons) with local-only actions:
- **Draft execution plan** — stream a plan from the task `body` and write it back via `updateTask` (`app/utils/task-save.ts`), which commits to `main` through `app/utils/git-backend.ts`. Needs a git token → gate behind `useGitToken()` (from `app/islands/git-token-banner.tsx`), like every other committer.
- **Generate subtasks** — model emits N subtask titles; create each as a child task via `createTask`/`task-save.ts` (mirror how `app/islands/task-subtasks.tsx` opens `TaskCreateDrawer` with `defaultParentTaskSlug`). Each commit is a separate git write.
- **Draft deliverable** — generate markdown for the task's output and append it to the task body (or a clearly-marked section), committed via `updateTask`.

Implementation notes:
- Use the shared `llm-inference.ts` provider from `pms-llm-inference-provider`; chunk long bodies to fit the small model's context.
- Show generation progress and allow cancel (provider's `AbortSignal`).
- All writes reuse `git-backend.ts` (token-gated, no new server) — same as task delete/clone today.
- Hide the actions entirely when `supportsLocalInference()` is false (no WebGPU/WASM path).

Acceptance: open a task with a title + body, click "Generate subtasks" → N child tasks appear (committed, visible after rebuild) with no call to any remote LLM.
