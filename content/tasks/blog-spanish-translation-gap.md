---
title: Close the Spanish (es) blog translation gap
project: blog-website
status: To Do
priority: High
assignee: Diego Ramos
dueDate: 2026-09-15
tags:
  - blog
  - i18n
  - spanish
---

`content/posts/es/` contains only 1 of 4 posts (`server-components-islands-architecture.md`); `getting-started-with-honox`, `building-accessible-ui-components`, and `design-tokens-with-pandacss` are missing. Because `app/lib/posts.ts` falls back to the English file per-slug, the Spanish `/es/blog` listing silently shows those three posts in English (a mixed-language surface), and `/es/blog/by-author` and `/es/blog/by-tag` are sparse relative to the other locales.

Translate the three missing posts into Spanish under `content/posts/es/`, reusing the existing translated frontmatter style. Verify the es listing, tag archives, and author archive render fully localized. Consider whether `blog.excludeUntranslatedFromSearch` (currently `false`) should be `true` for es so English-fallback posts don't pollute Spanish search results until translated. This is the most visible i18n gap on a site that advertises six locales.
