---
title: "[LLM Assist] batched git commit for bulk-generated task/project files"
project: pms-llm
status: To Do
priority: Medium
assignee: Diego Ramos
dueDate: 2027-01-31
tags:
  - pms
  - ai
  - local-inference
  - engineering
---

Today `createTask` (`app/utils/task-save.ts`) writes exactly one file per call, which means bulk-creating 20 tasks produces 20 separate git commits — noisy and hard to review. Add a batched path so a prompt-driven bulk create lands as a single coherent change.

In `app/utils/git-backend.ts`, add a `commitFiles(paths, contents[], message)` (or extend `createFile`) that stages multiple files and opens **one** commit/PR with a single message (e.g. "feat(pms): bulk-create N tasks from roadmap doc"). Respect the existing auth/token flow (`useGitToken()`, the `TOKEN_STORAGE_KEY` localStorage pattern) and branch handling already in `git-backend.ts` — do not fork the commit logic.
- Provide a `createTasksBulk(items[])` in `app/utils/task-save.ts` that builds the per-task markdown from the same frontmatter serializer `createTask` uses, then calls `commitFiles` once.
- Offer the user a choice (in the review grid from `pms-llm-bulk-preview-review`): one commit for all, or one PR — default to a single commit on the current branch.
- Keep per-file error handling: if one task fails to serialize, report which row and continue the rest.

Depends on the git-backend layer already used by `pms-llm-bulk-create-from-doc`. This is pure infrastructure (Diego owns the provider/git path) and has no LLM dependency itself.
