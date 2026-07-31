---
title: Add component recipe / pattern docs
project: documentation-website
status: To Do
priority: Medium
assignee: Priya Nair
dueDate: 2026-09-10
tags:
  - docs
  - content
  - design-system
---

The ~56 component reference pages (`.mdx` under `content/components/`) document what each component does in isolation. Nothing shows how to combine them: a form layout with Fieldset + Field + validation, a dashboard with Grid + Card + PaginatedTable, an overlay-inside-a-card using Card's "Overflow: visible" escape hatch, a navigation header pattern. These are the real questions someone porting the starter hits, and right now the answers are scattered across Architecture and PageBuilder prose.

Author a "Patterns" guide (MDX, so it can render live composed examples) covering 4–6 recurring layouts, each as a copy-pasteable block plus a rendered demo. This bridges the reference docs into a usable system and is the highest-leverage *content* work after the quickstart. Cross-reference individual component pages from each pattern.
