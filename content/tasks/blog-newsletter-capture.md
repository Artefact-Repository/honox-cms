---
title: Wire up the newsletter subscribe form (it currently submits nowhere)
project: blog-website
status: To Do
priority: High
assignee: Sam Okafor
dueDate: 2026-08-15
tags:
  - blog
  - engineering
  - newsletter
---

The newsletter block at the bottom of `app/routes/blog/index.tsx` (and the locale-prefixed variant) renders an email `<input>` + "Subscribe" `<Button>` with no `action`, `method`, or submit handler. Submitting just reloads the page and captures nothing — a visibly broken feature on the primary blog surface.

Decide the capture mechanism (keep it isomorphic-friendly for SSG/edge): a server route under `app/routes/api/` that stores to the CMS/KV, posting to a third-party provider (Buttondown/Mailchimp/ConvertKit), or at minimum a client island that validates the email, calls an endpoint, and shows a success/error state. Add the corresponding toggle/endpoint to the blog config in `content/configs.json` (e.g. `blog.newsletterEndpoint`) so the section stays CMS-configurable. Add inline validation and a privacy-consent note. This is the highest-visibility broken interaction on the blog and should ship first.
