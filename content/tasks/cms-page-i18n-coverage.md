---
title: Finish i18n coverage of CMS pages
project: cms-page-builder
status: To Do
priority: High
assignee: Diego Ramos
dueDate: 2026-09-20
tags:
  - cms
  - i18n
---

Only 4 of the 11 default-locale pages are translated per locale: `content/pages/{zh,pt,de,fr,es}/` each contain just `about.json`, `blog.json`, `docs.json`, and `index.json`. The other 7 — `contact.json`, `product-landing.json`, `settings.json`, `tasks.json`, `wisp.json`, `test.json`, `playground.json` — exist only in English. `loadPage(slug, locale)` falls back to the en file, so on any non-English locale these render in English, and (for `tasks`/`settings`, which are app routes) the user gets a mixed-language surface. That undercuts a site that advertises six locales.

Decide per page: (a) translate the genuinely public marketing pages (`product-landing`, `contact`) into zh/pt/de/fr/es under `content/pages/<locale>/`; (b) for app-internal pages that are intentionally English-only (`tasks`, `settings`, `playground`), either exclude them from the i18n set or accept English and document it. This closes the biggest multilingual gap on the CMS surface.
