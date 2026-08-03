---
title: Migrate components to centralised colorPalette utility
project: ui-components
status: Done
priority: High
assignee: Priya Nair
dueDate: 2026-07-23
tags:
  - design-system
  - refactor
---

Replaced per-recipe `colorPalette` variants across all 13 accent-color components with one shared `css()` utility. Found and fixed unslotted-variant bugs in Carousel, Clipboard, and Search, plus a repo-wide "slate" alias bug along the way.
