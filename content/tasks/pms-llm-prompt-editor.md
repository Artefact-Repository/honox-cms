---
title: "[LLM Assist] natural-language editing of existing tasks & projects"
project: pms-llm
status: To Do
priority: Medium
assignee: Priya Nair
dueDate: 2027-02-01
tags:
  - pms
  - ai
  - local-inference
  - tasks
---

Extend prompt-driven help from *creating* new tasks to *editing* existing ones. A user types an instruction in natural language — e.g. "reschedule all high-priority Blog tasks to September", "mark the CMS security task done and move its subtasks to Diego", "split the i18n audit into one task per locale" — and the local LLM translates it into concrete operations on real tasks/projects, shown for review before applying. Depends on `pms-llm-inference-provider` (`app/utils/ai-engine.ts`) and reuses the review grid from `pms-llm-bulk-preview-review`.

Build an "AI edit" affordance (island or menu on `app/routes/tasks/index.tsx` / `app/routes/projects/[slug].tsx`):
- Take the user's free-text instruction plus the relevant current state (fetched via `app/lib/tasks.ts` `listTasks` / `listTasksByProject`, and `app/lib/projects.ts` `listProjects`). Scope the context to what's needed — the small model can't ingest the whole repo.
- Prompt the model via `runStructuredCompletion()` (`ai-engine.ts`) for a structured **operation list**: `{ op: "update"|"create"|"delete"|"reparent", target: <slug>, patch: {...} }`, JSON-schema-constrained with `target` as an `enum` of real current slugs — same pattern `task-extraction.ts` uses to keep `project` from being invented, applied here to keep `target` from referencing a task that doesn't exist.
- Feed the operations into the review grid as a **before → after diff per changed field per row** (not just the raw patch), editable, confirm-before-apply.
- Apply via `updateTask`/`createTask`/`deleteTask` (`app/utils/task-save.ts`) or `createProject`/`deleteProject` — prefer the atomic batched commit in `pms-llm-batch-commit` (fetch each target's current `sha` right before commit, not from whenever the page loaded, to avoid a stale-write conflict).
- Gate the git-writing actions behind `useGitToken()` (from `app/islands/git-token-banner.tsx`); the *suggesting* is local, the *applying* needs the token, same as every other committer.
- Hide entirely when `isWebGpuSupported()` is false.

Acceptance: type "move all Documentation-Website tasks due after Oct to Nov" → grid shows the proposed updates as a diff → confirm → tasks updated in one commit, no remote LLM.
