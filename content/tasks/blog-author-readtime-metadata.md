---
title: Populate author and read-time metadata on all posts
project: blog-website
status: To Do
priority: High
assignee: Priya Nair
dueDate: 2026-08-20
tags:
  - blog
  - content
---

All four English posts in `content/posts/*.md` ship with `author: ''` and `readTime: ''`. `app/lib/posts.ts` then falls back to `author: "Artefact Team"` and `readTime: "5 min read"` for every post — so every byline on the listing, post detail, and by-author archive is identical and meaningless, and the read time is a constant lie.

Set a real `author` (a person or a team handle) and an accurate `readTime` (e.g. "7 min read") on each of the four English posts, and mirror the values into the five translation files under `content/posts/{zh,pt,de,fr,es}/*.md` (frontmatter isn't localised per-file but each file still needs the field). This makes the by-author archive (`app/routes/blog/by-author/[author].tsx`) actually meaningful and the read-time meta honest. Low effort, immediate content-correctness win.
