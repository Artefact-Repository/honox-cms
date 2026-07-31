---
title: "[LLM Assist] AI draft in the task write-up drawer"
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

Add an "AI draft" affordance to the New/Edit Task drawer (`app/islands/task-create-drawer.tsx`) — the write-up surface. This is the first of the two halves the user named ("task write-up").

Behavior:
- Place an "AI draft" button next to the **Title** field and/or the **Description** textarea (body, lines ~327-334; form shape at lines 43-68). On click, take the current `form.title` (plus project context from `props.projects`) and call the `llm-inference.ts` provider from `pms-llm-inference-provider`.
- The model returns a structured result: a markdown **Description** body + suggested **priority**, **tags**, and **assignee**. Populate `form` via `setForm((f) => ({ ...f, body: ..., priority: ..., tags: ..., assignee: ... }))`.
- Show a loading state during generation (reuse the toaster `loading` pattern from `app/components/ui/toast.tsx` or an inline spinner) and wire the provider's `AbortSignal` to a Cancel action.
- **Render the button only when `supportsLocalInference()` is true** (from the provider). Drafting is local and needs no git token — it just fills the form; committing still goes through `createTask`/`updateTask` (`app/utils/task-save.ts`) as today.
- Surface the privacy guarantee inline ("Generated locally — your task text never leaves this browser").

Acceptance: type a 3-word title → click AI draft → Description + suggested tags/priority/assignee appear, editable before save. No network call to any LLM API.
