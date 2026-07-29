---
title: Fix SSR/island useId() collisions
project: ui-components
parentTask: uic-hydration-variant-reset
status: To Do
priority: Medium
assignee: Priya Nair
dueDate: 2026-08-25
tags:
  - bug
  - a11y
---

Fieldset's SSR-rendered id and a hydrated Field/Textarea island's client-generated id can both land on the same value (e.g. `:r0:`), silently breaking label-for-input association. Every usage currently passes explicit `id`s as a workaround — needs a real per-island id namespace so this can't collide by default.
