---
title: LLM Assist — review/edit grid for LLM-extracted tasks before commit
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

A safety rail that stops garbage tasks from being committed. Before any bulk-created or prompt-edited batch hits git, the user must see and be able to fix every row. Shared by `pms-llm-bulk-create-from-doc` and `pms-llm-prompt-editor`.

Create a review grid (e.g. `app/islands/task-review-grid.tsx`) that:
- Renders each extracted/edited item as an editable row reusing the existing field primitives from `app/islands/task-create-drawer.tsx` (title input, priority select, tags input, assignee select, project select, dependsOn).
- Lets the user reorder, toggle (include/exclude), and delete rows; inline-edit any field; and re-run generation on a single row if it looks wrong.
- Validates against existing data: confirm `project` resolves to a real slug (`app/lib/projects.ts`), warn on unknown `assignee`, and show `dependsOn` as selectable existing tasks (`app/lib/tasks.ts` `listTasks`).
- Exposes an explicit "Create N tasks" / "Apply changes" action that only fires after the user confirms — nothing is written to git until then.

This is the human-in-the-loop checkpoint for an on-device model that will occasionally hallucinate structure; treat it as mandatory, not optional UX polish.
