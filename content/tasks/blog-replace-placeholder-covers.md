---
title: "[Bug] Replace placeholder covers and add covers to cover-less posts"
project: blog-website
status: To Do
priority: Medium
assignee: Mia Chen
dueDate: 2026-09-10
tags:
  - blog
  - content
  - design
---

Two of the four posts (`getting-started-with-honox`, `server-components-islands-architecture`) have no `cover` in frontmatter, so `app/routes/blog/index.tsx` excludes them from the hero `Carousel` (`featuredPosts = blogPosts.filter(p => p.cover)`) — the most prominent real estate on the blog. The other two use random `picsum.photos` seeds, which look generic and unrelated to the topic.

Add a real, on-brand `cover` image to all four posts (and their translation files) — project-owned illustrations/OG images or curated photography. Keep the 1200×675 ratio the templates expect. This puts every post into the featured carousel and removes the "random photo" feel from the listing and the by-tag/by-author grids (which also gate cover display on `post.cover`).
