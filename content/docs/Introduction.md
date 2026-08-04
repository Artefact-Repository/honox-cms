---
title: Introduction
---

This is a full-stack starter built on [**HonoX**](https://github.com/honojs/honox), pairing a type-safe styling system with a Git-backed CMS, and shipping the whole thing as a static site. It's meant to be a batteries-included foundation for content-driven sites — docs, blogs, marketing pages — that still want real interactive components where it matters.

| Piece | What it does |
| --- | --- |
| [HonoX](https://github.com/honojs/honox) | Meta-framework on [Hono](https://hono.dev) — file-based routing, server/client islands |
| [PandaCSS](https://panda-css.com) | Type-safe, zero-runtime CSS-in-JS, compiled ahead of time |
| [Sveltia CMS](https://sveltiacms.app) | Git-backed content editing at `/admin/` — no database, no backend service |
| [`@hono/vite-ssg`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg) | Pre-renders every route to static HTML at build time |

---

## Why This Stack

Most UI component libraries are built for one specific JavaScript framework — a liability the moment you need to mix frameworks or switch later. [HonoX](https://github.com/honojs/honox) sidesteps that as a **meta-framework**: it lets you _Bring Your Own Renderer_ (BYOR), so our components stay _framework-agnostic_, resolved entirely at build time rather than tied to a client runtime. Paired with [`@hono/vite-ssg`](https://github.com/honojs/vite-plugins/tree/main/packages/ssg), this also gives us:

* **Static and framework-less by default.** The build output is plain HTML/CSS/JS — no server process is required at request time, so it deploys anywhere static files are served (Cloudflare Pages and Vercel are configured out of the box). You're free to bring your own framework, but it's not necessary.

* **Interactive where it counts.** Not every component needs to ship JavaScript. A three-tier [hydration](/docs/Hydration) model lets each component decide whether it hydrates eagerly, conditionally, or never — keeping the client bundle small without giving up rich UI.

The UI components started as a port of [Park UI](https://park-ui.com/) ([Ark UI](https://ark-ui.com/)) from React to Hono/jsx. For each component, we've built matching bindings for [Sveltia CMS](https://sveltiacms.app), a git-backed CMS, so content stays easily editable via a web admin UI without having to touch code. It also makes the UI code cleaner and more data-driven. The CMS is local-first, runs entirely client-side and commits directly to files under `content/`, so editors can write blog posts and docs, or compose whole pages visually through the [Page Builder](/docs/PageBuilder), while developers keep everything in version control.

[PandaCSS](https://panda-css.com) is used to generate all CSS ahead of time from statically analyzable style calls — no runtime style engine, no class-name collisions, and full type safety on design tokens.

---

## What's Inside

* **\~60 UI components** under `app/components/ui/`, covering layout, forms, overlays, and data display, each with a matching interactive island in `app/islands/` where needed.
* **A blog** (`content/posts/`) with tagging, author pages, and a read-only JSON API.
* **A visual page builder** (`content/pages/`) for composing pages from nested components entirely through the CMS.
* **Docs** (this section) authored as plain Markdown or MDX, the latter for pages that need a live, rendered example embedded in the prose.
* **i18n** across six locales (`en`, `zh`, `es`, `pt`, `fr`, `de`) for docs, components, and site chrome.
