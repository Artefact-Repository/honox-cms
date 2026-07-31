---
title: Fix sidenav ordering and split the mega-guides
project: documentation-website
status: To Do
priority: Medium
assignee: Mia Chen
dueDate: 2026-08-13
tags:
  - docs
  - content
  - i18n
---

Two concrete issues in the docs sidenav today:

1. `docOrder` in `content/configs.json` lists only Introduction, Getting-Started, Architecture, Hydration, PageBuilder — so Styling-Theming and PMS are missing and fall to the end of the Guides group in alphabetical order, breaking the natural reading sequence. Add both to `docOrder` in their logical position (Styling-Theming after Hydration; PMS after PageBuilder). This is a one-line, near-zero-risk config edit.

2. Architecture.md is a ~250-line monolith covering the build, routing, component architecture, content pipelines/i18n, styling, CMS, and deployment in one file. Consider splitting it into focused standalone guides (e.g. a dedicated "Routing & Locales" guide and a "Deployment" guide) so the sidenav tells a clearer story and the on-this-page TOC (see sibling task) stays shallow. Start with the docOrder fix; the split is a larger content effort and can phase in after the TOC lands.
