---
title: Add "copy link to heading" anchors on post headings
project: blog-website
status: To Do
priority: Low
assignee: Sam Okafor
dueDate: 2026-10-20
tags:
  - blog
  - ux
  - engineering
---

Post bodies are rendered from markdown in `app/utils/markdown.ts` (`markdownToHtml`) via the remark/rehype unified pipeline, which currently emits heading elements with no `id` or anchor. Readers can't deep-link to a section, and the share button only copies the post URL — no "link to this heading" affordance like most modern docs/blog engines.

Add a rehype plugin to the `htmlProcessor` in `app/utils/markdown.ts` that assigns a slugified `id` to each `h2`/`h3` (and ideally nests `h1` out) and injects a small `#` anchor link on hover. The slug must match whatever the blog detail page's future "On this page" TOC (`blog-post-detail-enhancements`) generates so the two stay consistent — define the slugify in one shared helper if needed. Low effort, pairs naturally with the TOC task.
