---
title: Audit and triage doc i18n translation coverage
project: documentation-website
status: To Do
priority: Medium
assignee: Mia Chen
dueDate: 2026-08-20
tags:
  - docs
  - i18n
  - content
---

The docs span 7 guides + ~56 component references across 5 non-English locales (zh, es, pt, fr, de) — a large surface. `loadDocs`/`loadDocBySlug` silently fall back to the English file when a translation is missing, so untranslated docs render fine but the site quietly serves mixed-language content with no signal of what's complete.

Produce a coverage report: for each locale, which guides and component pages have a real translation vs. an English fallback. Use it to triage — prioritise translating the guides (highest-traffic, most onboarding-critical) over the full 56-component set, and decide whether component reference pages should be translation-exempt (they're largely code/props, like API reference). This pairs with the page-builder i18n gaps already tracked under the UI Components project. Output is the report plus a prioritised translation backlog, not the translations themselves.
