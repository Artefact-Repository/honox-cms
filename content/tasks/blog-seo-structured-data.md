---
title: Add JSON-LD Article schema, social cards, and an RSS feed to the blog
project: blog-website
status: To Do
priority: Medium
assignee: Priya Nair
dueDate: 2026-10-10
tags:
  - blog
  - seo
  - engineering
---

`loadPostBySlug` in `app/lib/posts.ts` already computes `relatedPosts` (up to 3 by shared tag) and the post page renders them — but there's no machine-readable metadata: no `JSON-LD` `Article`/`BlogPosting` schema, no `og:`/`twitter:` tags beyond the `<title>`, and no `RSS`/`Atom` feed despite the read-only JSON API theme. That hurts SEO and link unfurls.

Add (a) `JSON-LD` `BlogPosting` schema to `app/routes/blog/[slug].tsx` (title, author, datePublished, image, description), (b) `og:title/description/image` + `twitter:card` meta, and (c) an `/api/posts/rss.xml` (or `blog.xml`) feed route generated from `loadPosts`, with a link in the blog listing `<head>`. Medium effort; makes the blog discoverable and shareable the way a real publication is.
