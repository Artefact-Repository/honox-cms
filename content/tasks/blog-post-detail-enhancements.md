---
title: Add reading-progress and on-page navigation to the post detail page
project: blog-website
status: To Do
priority: Medium
assignee: Sam Okafor
dueDate: 2026-10-01
tags:
  - blog
  - ux
  - engineering
---

`app/routes/blog/[slug].tsx` is a competent article page (cover, byline, share, related posts) but functionally bare compared to the polished listing: no reading-progress indicator, no on-this-page TOC for longer posts, and no "last updated" / edit-on-GitHub link. Longer posts (e.g. the islands-architecture piece) lose the reader with no sense of position.

Add (a) a slim top reading-progress bar via a client island (follow the existing `app/islands/` pattern), (b) an optional sticky right-rail "On this page" TOC built from the H2/H3 of `post.html` with scrollspy, hidden below `md`, and (c) a "Last updated" date + source link in the meta row, sourced from git or frontmatter. Mirror into the locale variant. Medium effort, high perceived-quality return on the page readers spend the most time on.
