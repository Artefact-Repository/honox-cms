---
title: Remove or gate stray demo pages (test.json, wisp.json)
project: cms-page-builder
status: To Do
priority: Medium
assignee: Mia Chen
dueDate: 2026-09-10
tags:
  - cms
  - content
  - hygiene
---

Two pages look like scratch/demo content rather than shipped product:
- `content/pages/test.json` — titled "Test Page", subtitle "This page demonstrates the power of our sveltiacms-backed nested component renderer." It's a component showroom that gets statically generated to `/test` and indexed by search engines.
- `content/pages/wisp.json` — a full product landing page for "Wisp — AI Notes That Write Themselves," which reads like a marketing demo, not part of the actual product.

Decide intent: if `test.json` is a teaching/playground aid, fold it into the existing `/playground` (`content/pages/playground.json` + the `pagePlayground` block) and exclude it from the public route/SSG so it stops being indexed; if `wisp.json` is a real page, keep it and give it a nav entry + translation, otherwise remove it. Stray demo pages hurt SEO and confuse editors about what's "real."
