---
title: Ship git-backed Projects/Tasks views
project: ui-components
status: Done
priority: Medium
assignee: Diego Ramos
dueDate: 2026-07-29
tags:
  - tooling
  - cms
---

Added `projects`/`tasks` CMS collections plus list/detail loaders and read-only board + list views. No drag-and-drop by design — content is git-committed through `/admin`, not live-editable, so the board is a grouped read-only layout rather than an interactive Kanban.
