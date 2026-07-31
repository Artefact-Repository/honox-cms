---
title: "[LLM Assist] bulk-create tasks from a roadmap/implementation doc"
project: pms-llm
status: To Do
priority: High
assignee: Priya Nair
dueDate: 2027-01-15
tags:
  - pms
  - ai
  - local-inference
  - tasks
---

Flagship of the prompt-driven editing idea: a user pastes (or uploads) an implementation roadmap / spec document and the local LLM extracts a structured list of tasks, which are then batch-created via the existing git path. Depends on `pms-llm-inference-provider` landing (the `app/utils/llm-inference.ts` provider).

Build a new island `app/islands/task-bulk-create.tsx` (mount it on `app/routes/tasks/index.tsx` or a dedicated `/tasks/bulk-create` route):
- A large textarea for the doc text, plus an optional file input accepting `.md`/`.txt` (read client-side via `FileReader` — no upload, which keeps the local-inference privacy promise intact).
- A "Generate tasks" button (shown only when `supportsLocalInference()` is true). On click, send the doc + a strict extraction instruction to `llm-inference.ts`, asking for a JSON array of task objects: `{ title, body, priority, tags[], assignee, project, dependsOn[] }`.
- **Robust parsing is the hard part.** Small on-device models (SmolLM2-1.1B / Qwen2.5-0.5B q4) routinely emit malformed JSON. Use a constrained/few-shot prompt, then parse defensively: strip code fences, extract the first `[...]` block, and fall back to a line-by-line or `**Title:**` pattern if JSON fails. Surface any rows the model produced that can't be parsed rather than silently dropping them.
- Map `project` names to existing slugs via `app/lib/projects.ts` (`listProjects`); if a referenced project doesn't exist, either create it (see `pms-llm-batch-commit` + `createProject` in `app/utils/project-save.ts`) or flag it for the user in the review grid.
- Hand the parsed rows to the review grid from `pms-llm-bulk-preview-review`, then commit via `createTask` (`app/utils/task-save.ts`) — prefer the batched commit in `pms-llm-batch-commit`.

Acceptance: paste a 1-page roadmap → click generate → a reviewable table of N tasks appears, each mapped to a real project/priority, committable in one action. No remote LLM, no file leaves the browser.
