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
- Use the shared engine from `pms-llm-inference-provider` (`app/utils/ai-engine.ts`'s `getEngine()`/`runStructuredCompletion()`); chunk long bodies the same way `task-extraction.ts`'s `chunkDocument()` does, to fit the model's usable context.
- Show generation progress via `ai-engine.ts`'s `onProgress` callback. No cancellation support yet — `ai-engine.ts` doesn't currently accept an `AbortSignal` (WebLLM's own `chat.completions.create` doesn't take one either); flag this as an open gap if it's needed here, don't silently drop the requirement.
- All writes reuse `git-backend.ts` (token-gated, no new server) — same as task delete/clone today.
- Hide the actions entirely when `isWebGpuSupported()` is false (`ai-engine.ts`) — no WASM/CPU fallback exists for WebLLM.

Acceptance: open a task with a title + body, click "Generate subtasks" → N child tasks appear (committed, visible after rebuild) with no call to any remote LLM.
