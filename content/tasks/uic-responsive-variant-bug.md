---
title: Fix responsive variant props emitting no CSS
project: ui-components
status: To Do
priority: Urgent
assignee: Priya Nair
dueDate: 2026-08-15
tags:
  - bug
  - styling
---

A responsive variant value (e.g. `size={{ base, md }}`) on any slot-recipe UI component renders the correct className but Panda never emits the breakpoint CSS. Affects every recipe-based component in `app/components/ui`, so responsive props are currently unusable repo-wide — needs a generic fix, not a per-component workaround.
