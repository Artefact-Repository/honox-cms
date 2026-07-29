---
title: Fix Drawer/Dialog variant props resetting after hydration
project: ui-components
status: To Do
priority: Medium
assignee: Sam Okafor
dueDate: 2026-08-20
tags:
  - bug
  - hydration
---

Non-default slot-recipe variant props (`placement`, `size`) on Drawer/Dialog revert to their default once the client hydrates. Every usage currently has to override via `[data-part]` CSS instead of the prop actually working — needs a real fix in the island hydration path rather than more CSS overrides.
