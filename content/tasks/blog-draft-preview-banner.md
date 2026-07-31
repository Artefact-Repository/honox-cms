---
title: Add a draft-preview banner + safe non-prod draft handling
project: blog-website
status: To Do
priority: Low
assignee: Mia Chen
dueDate: 2026-10-25
tags:
  - blog
  - ux
  - engineering
---

Every post shows a "Draft" badge already (`post.draft === true` in `app/routes/blog/[slug].tsx`, listing, and archives), and `loadPosts`/`loadPostBySlug` in `app/lib/posts.ts` skip draft posts only in `production`. But there's no explicit in-context signal that you're viewing a *pre-publish* preview — a reviewer opening `/blog/<slug>` on a draft sees the article with just a small badge and may think it's live.

Add a prominent sticky top banner ("Draft preview — not published" / localized) when `post.draft` is true on the detail page (and surface a drafts-only view on the listing for non-prod, e.g. a "Show drafts" toggle). Guard so drafts never appear in production listings, search index, tag/author archives, or the sitemap/feed regardless of the banner. Keep the localized strings (zh/de/fr/es/pt) consistent with the existing `currentLocale === "zh" ? ... : ...` pattern. Low effort, prevents accidental "is this live?" confusion during editorial review.
