---
title: Blog Website
summary: Make /blog a credible, working editorial surface — fix the broken
  newsletter capture, fill author/read-time metadata, close the Spanish
  translation gap, and replace placeholder covers.
status: Active
colorPalette: red
owner: Mia Chen
startDate: 2026-08-01
dueDate: 2026-10-15
tags:
  - blog
  - content
  - i18n
---

Improvement programme for `/blog`: the listing, post detail, tag/author archives, and the `/api/posts` JSON API. The blog UI is already polished — carousel hero, instant search, tag/author browse, related posts — but the content and a couple of features are hollow:

- The newsletter form at the bottom of the listing **submits nowhere**.
- All four posts ship with empty `author`/`readTime`, so every byline falls back to "Artefact Team" / "5 min read".
- Two posts have no cover (excluded from the hero carousel) and the rest use random Picsum photos.
- Spanish has only 1 of 4 posts translated, which silently degrades the `es` listing and breaks the by-author/by-tag archives.

**Goal:** a blog where every post has a real author, an accurate read time, a real cover, and every supported locale is actually populated.
