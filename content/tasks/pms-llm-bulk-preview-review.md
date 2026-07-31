---
title: "[LLM Assist] review/edit grid for LLM-extracted tasks before commit"
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
- Renders each `CandidateTask` (see `app/utils/task-extraction.ts`) as an editable row reusing the existing field primitives from `app/islands/task-create-drawer.tsx` (`Field`, `Textarea`, `TagsField`, `InteractiveCombobox` for project/status/priority).
- Per-row checkbox, checked by default — the point is bulk-approve-with-edits, not blind trust. Shows a running "N of M selected" count and select-all/none.
- Lets the user inline-edit any field, and re-run extraction on a single row ("regenerate this one") if it looks wrong, rather than having to redo the whole batch.
- Validates before commit: `project` already can't be anything but a real slug (schema-constrained at generation time — see `pms-llm-bulk-create-from-doc`), but still check the target slug (from the title) doesn't collide with an existing `content/tasks/*.md` file, same auto-suffix logic `cloneTask` already uses in `app/utils/task-save.ts`.
- Exposes an explicit "Create N tasks" / "Apply changes" action that only fires after the user confirms — nothing is written to git until then.

This is the human-in-the-loop checkpoint for an on-device model that will occasionally hallucinate structure; treat it as mandatory, not optional UX polish.
