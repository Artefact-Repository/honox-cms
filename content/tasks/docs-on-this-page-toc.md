---
title: Add "On this page" right-rail TOC with scrollspy
project: documentation-website
status: To Do
priority: High
assignee: Sam Okafor
dueDate: 2026-08-20
tags:
  - docs
  - ux
  - engineering
---

The longest guides — Architecture (~250 lines), PageBuilder (~200 lines), Styling & Theming (~180 lines) — render as a single unbroken column with only the left sidenav for orientation. A reader three screens deep has no sense of where they are in the page.

Add a sticky right-rail "On this page" table of contents to `app/routes/docs/[doc].tsx` (and the locale variant) that extracts H2/H3 headings from the rendered doc body, anchors them, and highlights the active section on scroll. Scrollspy needs a client island (follow the existing island pattern in `app/islands/`); the heading list can be server-rendered from the markdown/MDX. Hide the rail below `md` like the existing sidenav. This is the single biggest readability win for the docs and should land first.
