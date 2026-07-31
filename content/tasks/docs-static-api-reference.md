---
title: Document the static JSON API endpoints
project: documentation-website
status: To Do
priority: Medium
assignee: Sam Okafor
dueDate: 2026-09-03
tags:
  - docs
  - api
  - engineering
---

The starter ships read-only JSON endpoints built by the SSG pass — `/api/posts.json`, `/api/posts/[lang]/search.json`, and `/api/docs/search.json` (see `app/routes/api/`) — but none are documented. For a batteries-included starter that markets itself as having a "read-only JSON API", an undocumented API surface is a gap that costs every integrator an archaeology pass through the route files.

Write an API reference doc covering: the available endpoints, their path/params, the shape of each response, and the locale fallback behaviour (an untranslated doc falls back to English in both the listing and the search index). Include a couple of `fetch` examples. House it under `content/docs/` and add it to the Guides `docOrder`. Verify the documented shapes against the actual route handlers before publishing — do not transcribe from memory.
