---
title: Introduction
---

This is a full-stack starter built on [**HonoX**](https://github.com/honojs/honox), pairing a type-safe styling system with a Git-backed CMS, and shipping the whole thing as a static site. It's meant to be a batteries-included foundation for content-driven sites — docs, blogs, marketing pages — that still want real interactive components where it matters.

| Piece | What it does |
| --- | --- |
| [HonoX](https://honox.dev) | Meta-framework on [Hono](https://hono.dev) — file-based routing, server/client islands |
| [PandaCSS](https://panda-css.com) | Type-safe, zero-runtime CSS-in-JS, compiled ahead of time |
| [Sveltia CMS](https://sveltiacms.app) | Git-backed content editing at `/admin/` — no database, no backend service |
| [`@hono/vite-ssg`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg) | Pre-renders every route to static HTML at build time |

***

## Why This Stack

* **Static by default.** The build output is plain HTML/CSS/JS — no server process is required at request time, so it deploys anywhere static files are served (Cloudflare Pages and Vercel are configured out of the box).
* **Interactive where it counts.** Not every component needs to ship JavaScript. A three-tier [hydration](/docs/Hydration) model lets each component decide whether it hydrates eagerly, conditionally, or never — keeping the client bundle small without giving up rich UI.
* **Content editable without touching code.** [Sveltia CMS](https://sveltiacms.app) runs entirely client-side and commits directly to files under `content/`, so editors can write blog posts, docs, and even compose whole pages visually through the [Page Builder](/docs/PageBuilder), while developers keep everything in version control.
* **Styled with confidence.** [PandaCSS](https://panda-css.com) generates all CSS ahead of time from statically analyzable style calls — no runtime style engine, no class-name collisions, and full type safety on design tokens.

***

## What's Inside

* **\~50 UI components** under `app/components/ui/`, covering layout, forms, overlays, and data display, each with a matching interactive island in `app/islands/` where needed.
* **A blog** (`content/posts/`) with tagging, author pages, and a read-only JSON API.
* **A visual page builder** (`content/pages/`) for composing pages from nested components entirely through the CMS.
* **Docs** (this section) authored as plain Markdown or MDX, the latter for pages that need a live, rendered example embedded in the prose.
* **i18n** across six locales (`en`, `zh`, `es`, `pt`, `fr`, `de`) for docs, components, and site chrome.

***

## Finding Your Way Around

* [Getting Started](/docs/Getting-Started) — install dependencies and run the project locally.
* [Architecture](/docs/Architecture) — a deeper look at the build, routing, component structure, and content pipelines.
* [Hydration](/docs/Hydration) — how components opt into client-side interactivity.
* [CMS Page Builder](/docs/PageBuilder) — composing pages visually through Sveltia CMS.
