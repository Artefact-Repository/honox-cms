# HonoX + PandaCSS + Sveltia CMS Starter

Full-stack [HonoX](https://github.com/honojs/honox) starter with type-safe CSS-in-JS ([PandaCSS](https://panda-css.com/)), and a Git-backed CMS ([Sveltia CMS](https://sveltiacms.app/)).

Live demo: [https://honox.chen.so](https://honox.chen.so), [https://honox-ts.vercel.app](https://honox-ts.vercel.app)

---

## What's Inside

| Feature | Details |
|---|---|
| **Framework** | [HonoX](https://honox.dev) — meta-framework on Hono |
| **Styling** | [PandaCSS](https://panda-css.com) — type-safe, zero-runtime CSS-in-JS |
| **CMS** | [Sveltia CMS](https://sveltiacms.app) — Git-backed, runs at `/admin/` |
| **Blog** | Markdown posts in `content/posts/`, rendered at `/blog` |
| **API** | Read-only JSON REST API for posts at `/api/posts/*` |
| **SSG** | Static site generation via `@hono/vite-ssg` |
| **Deploy** | Cloudflare Pages (`wrangler.jsonc`) |

---

## Architecture

### Routes

Locale, where present, always comes **before** the collection/item (`/zh/blog`, `/zh/docs/Foo`, `/zh/about`) — not after. This isn't stylistic: a collection's locale-index route and its English detail route would otherwise share the exact same router shape (e.g. `/docs/:locale` vs. `/docs/:doc`), and only one of two identically-shaped dynamic routes can ever be statically generated. Putting `[locale]` first makes them different shapes, so both coexist. See `app/lib/i18n.ts`'s top-of-file doc comment for the full reasoning.

| Route | File | Purpose |
|---|---|---|
| `/` (+ `/:locale`) | `app/routes/index.tsx` (+ `app/routes/{locale}/index.tsx`, one hardcoded file per locale) | Homepage — Page Builder-driven (`content/pages/index.json`), locale-aware |
| `/blog` (+ `/:locale/blog`) | `app/routes/blog/index.tsx` (+ `app/routes/[locale]/blog/index.tsx`) | Post list with tag filtering |
| `/blog/by-tag/:tag` (+ `/:locale/blog/by-tag/:tag`) | `app/routes/blog/by-tag/[tag].tsx` (+ `app/routes/[locale]/blog/by-tag/[tag].tsx`) | Tag-filtered post list (static) |
| `/blog/by-author/:author` (+ `/:locale/blog/by-author/:author`) | `app/routes/blog/by-author/[author].tsx` (+ `app/routes/[locale]/blog/by-author/[author].tsx`) | Author-filtered post list (static) |
| `/blog/:slug` (+ `/:locale/blog/:slug`) | `app/routes/blog/[slug].tsx` (+ `app/routes/[locale]/blog/[slug].tsx`) | Individual post |
| `/docs` (+ `/:locale/docs`) | `app/routes/docs/index.tsx` (+ `app/routes/[locale]/docs/index.tsx`) | Docs index with sidenav |
| `/docs/:doc` (+ `/:locale/docs/:doc`) | `app/routes/docs/[doc].tsx` (+ `app/routes/[locale]/docs/[doc].tsx`) | Individual doc/component page |
| `/admin/` | `public/admin/index.html` | Sveltia CMS UI |
| `/pages/:slug` (+ `/:locale/pages/:slug`) | `app/routes/pages/[slug].tsx` (+ `app/routes/[locale]/pages/[slug].tsx`) | Dynamic CMS-built pages, long form |
| `/:page` (+ `/:locale/:page`) | `app/routes/[page].tsx` (+ `app/routes/[locale]/[page].tsx`) | Same pages, canonical short form (e.g. `/about`, `/zh/about`) |
| `/api/posts/index.json` | `app/routes/api/posts/index.json.ts` | Post collection (JSON) |
| `/api/posts/:slug.json` | `app/routes/api/posts/[slug].json.ts` | Single post detail (JSON) |
| `/api/posts/search.json` (+ `/api/posts/:locale/search.json`) | `app/routes/api/posts/search.json.ts` (+ `api/posts/[locale]/search.json.ts`) | Search index (JSON); English-only vs. locale-scoped |
| `/api/posts/by-author/:author.json` | `app/routes/api/posts/by-author/[author].json.ts` | Posts by author (JSON) |
| `/api/docs/search.json` (+ `/api/docs/:locale/search.json`) | `app/routes/api/docs/search.json.ts` (+ `api/docs/[locale]/search.json.ts`) | Docs search index (JSON) |

The `/:page`, `/:locale`, and `/:locale/:page` routes use a 2-arg `(c, next)` handler and are dev-server preview only — `@hono/vite-ssg` excludes 2-arg handlers from static generation. Their production HTML comes from `vite.config.ts`'s build-time copy plugins (`copyContentPagesToRootPlugin`, `copyLocalisedContentPagesPlugin`), which duplicate the already-correctly-generated long-form output (`/pages/:slug`, `/:locale/pages/:slug`) to the short-form path instead.

See [content/docs/Architecture.md](content/docs/Architecture.md) (served at `/docs/Architecture`) for the full routing/collision reasoning and UI components architecture details.

---

## Blog, Pages & CMS

### How it works

#### Blog Posts
1. **Write** — Markdown files in `content/posts/*.md` with YAML frontmatter.
2. **Manage** — Visit `/admin/` to edit posts.
3. **Build** — `bun run build` generates static HTML for post list and individual posts.
4. **Translate** — Add `content/posts/<locale>/<slug>.md` for a translated post (same convention as pages/docs); `loadPosts()`/`loadPostBySlug()` fall back to the English file for anything not translated. Each locale gets its own search index at `/api/posts/:locale/search.json`; set `blog.excludeUntranslatedFromSearch: true` in that locale's `content/configs.<locale>.json` once every post is actually translated, to stop search falling back to English-titled results for that locale.

#### Dynamic Pages
1. **Design** — Create pages in `content/pages/*.json` using the CMS UI. This includes the homepage itself (`content/pages/index.json`).
2. **Components** — Choose from 50+ UI components (Stack, Card, Dialog, etc.).
3. **Nesting** — Build complex layouts with recursive nesting (e.g., a Card inside a Stack inside another Stack).
4. **Render** — The `PageRenderer` component (`app/components/page-renderer.tsx`) maps JSON data to themed UI components, loaded via `app/lib/pages.ts`.
5. **Translate** — Add `content/pages/<locale>/<slug>.json` for a translated page; `loadPage()` falls back to the default-locale file for anything not translated.

---

## Posts API

A read-only JSON REST API over the same `content/posts/*.md` files that back `/blog`, prerendered by SSG like every other route. Because the site deploys as static files with no live server at request time, every endpoint's URL includes a literal `.json` suffix — that's the exact filename the build writes to `dist/`, so the same path works identically in dev (`bun run dev`) and once deployed.

| Endpoint | Description |
|---|---|
| `GET /api/posts/index.json` | All published posts (drafts excluded in production), newest first. Shape: `{ generated, total, tags, posts: BlogPost[] }`. |
| `GET /api/posts/:slug.json` | One post's full detail: frontmatter fields + rendered `html` + up to 3 `relatedPosts` sharing a tag. `404` with `{ "error": "Not found" }` for a missing or (in production) draft slug. |
| `GET /api/posts/search.json` | The English-only search index the `Search` island fetches by default. Shape: `{ generated, entries: SearchIndexEntry[] }`. |
| `GET /api/posts/:locale/search.json` | Same shape, scoped to one locale's translated posts (falling back to the English entry per-post unless that locale sets `blog.excludeUntranslatedFromSearch: true`). The `Search` island resolves this URL itself from its `locale` prop — see `localiseSearchSrc` in `app/islands/search.tsx`. |
| `GET /api/posts/by-author/:author.json` | All posts by a given author, newest first. Shape: `{ generated, author, total, posts: BlogPost[] }`. Returns empty array if no posts match. |

Implementation: `app/lib/posts.ts` (`loadPosts`, `loadPostBySlug`, `loadPostsByAuthor`) backs all routes. `app/routes/api/posts/_404.tsx` scopes a JSON not-found handler to this namespace so API errors don't fall back to the site's HTML 404 page.

---

## Sveltia Page Builder

This starter contains an advanced layout builder inside the Sveltia CMS `pages` collection. Users can construct complex, responsive, dynamic pages directly from the CMS UI.

### Recursively Nestable Components

We support a full collection of **50+ rich presentational and interactive components** (see [content/docs/PageBuilder.md](content/docs/PageBuilder.md) for the complete, categorized reference):

* **Layout & Structure:** `Stack` (Direction/Align/Justify/Gap), `Grid`, `Group` (Grow/Attached), `Fieldset` (Legend/Helper/Error), `Layout`, `AbsoluteCenter`, `Splitter`
* **Text & Typography:** `Heading` (Level/Size), `Text` (Content/Size)
* **UI Elements:** `Anchor`, `Avatar`, `Button` (Variant/Palette/Size), `Badge` (Variant/Palette/Size), `Alert` (Status/Variant), `Card` (Variant/Size/Clickable), `Breadcrumb`
* **Form & Controls:** `Checkbox`, `Combobox` (Items list/Clear trigger), `Field`, `Textarea`, `RadioGroup`, `RadioCardGroup`, `SegmentGroup`, `Slider`, `Switch`, `Select`, `Search`, `FileUpload`, `ColorPicker`, `PinField`, `RatingGroup`, `TagsField`, `DatePicker`, `Editable`
* **Feedback & Loaders:** `Progress` (Linear/Circular), `Skeleton` (NoOfLines/Circle), `Spinner`, `Loader`, `Toast` (global toast host, paired with a Button's raw onClick)
* **Overlays & Dialogs:** `Collapsible` (Trigger/Open), `Popover` (ShowArrow/Closable), `Tooltip`, `HoverCard`, `Dialog` (Cancel/Confirm/Closable), `Drawer` (Cancel/Confirm/Closable), `Dropdown` (Nestable item action list), `Tabs`
* **Tables & Data:** `PaginatedTable`, `Pagination`, `Table`
* **Media:** `Carousel`, `Clipboard`, `Icon`

### Multi-Level Nested Recursion

Components like `Stack`, `Grid`, `Card`, `Fieldset`, `Group`, `Field`, `Anchor`, `Layout`, `AbsoluteCenter`, `Splitter`, `HoverCard`, `Popover`, `Collapsible`, `Dialog`, and `Drawer` fully support **recursive children nesting**. Through carefully designed YAML anchors and references in Sveltia CMS `public/admin/config.yml` and a smart layout compiler inside `app/components/page-registry.tsx`, users can nest components (e.g. Buttons/Skeletons inside a Card inside a Collapsible inside a Stack) to build sophisticated dashboard layouts.

---

## CMS Setup

Sveltia CMS is configured in `public/admin/config.yml`. You can use it **locally** or with a **Git backend**:
- **GitHub:** `name: github`
- **GitLab:** `name: gitlab`
- **Bitbucket:** `name: bitbucket`
- **Azure:** `name: azure`

See [Sveltia CMS docs](https://sveltiacms.app/en/docs/backends) for details.

---

## Local Development

### Prerequisites
- Bun 1.0+
- Node.js 18+ (for PandaCSS)

### Commands

| Command | Purpose |
|---|---|
| `bun run dev` | Dev server with HMR (`http://localhost:5173`) |
| `bun run build` | Client + server build + SSG |
| `bun run start --static` | Serve `dist/` statically (no SSR) |
| `bun run deploy` | Deploy to Cloudflare Pages |

---

## Project Structure

````
app/
  components/page-renderer.tsx # Dynamic Page layout compiler
  components/ui/    # Public component API
  islands/          # Client-side interactive islands
  routes/           # File-based routing — locale always comes before the
                     #   collection/item; see the Routes table above
    index.tsx                       # Homepage (English)
    [locale]/index.tsx              # Homepage, one hardcoded file per locale
                                     #   (NOT a dynamic [locale] segment — that
                                     #   would collide with [page].tsx, same
                                     #   /:x shape; see Architecture.md)
    blog/index.tsx                  # Post list (English)
    blog/[slug].tsx                 # Individual post (English)
    blog/by-tag/[tag].tsx           # Tag-filtered post list (English)
    blog/by-author/[author].tsx     # Author-filtered post list (English)
    [locale]/blog/index.tsx         # Post list, all locales — genuinely
                                     #   dynamic, no per-locale files needed
    [locale]/blog/[slug].tsx        # Individual post, all locales
    [locale]/blog/by-tag/[tag].tsx
    [locale]/blog/by-author/[author].tsx
    docs/index.tsx                  # Docs index (English)
    docs/[doc].tsx                  # Individual doc page (English)
    [locale]/docs/index.tsx         # Docs index, all locales
    [locale]/docs/[doc].tsx         # Individual doc page, all locales
    pages/[slug].tsx                # Page builder route (English), long form
    [locale]/pages/[slug].tsx       # Same, all locales, long form
    [page].tsx                      # Same pages, short form (English) — /about
    [locale]/[page].tsx             # Same, all locales — /zh/about (canonical)
    api/posts/                      # Read-only posts REST API
      index.json.ts                 # GET /api/posts/index.json — collection
      [slug].json.ts                # GET /api/posts/:slug.json — single post
      search.json.ts                # GET /api/posts/search.json — English-only search index
      [locale]/search.json.ts       # GET /api/posts/:locale/search.json — locale-scoped index
      by-author/[author].json.ts    # GET /api/posts/by-author/:author.json
      _404.tsx                      # JSON 404s scoped to /api/posts/*
    api/docs/
      search.json.ts                 # GET /api/docs/search.json
      [locale]/search.json.ts        # GET /api/docs/:locale/search.json
  lib/i18n.ts       # Locale detection + href localization — detectLocale,
                     #   localiseHref, stripLocale, localeToggleUrl
  lib/posts.ts      # Post loading/parsing shared by blog pages + API, locale-aware
  lib/pages.ts      # Page builder JSON loading, locale-aware
  lib/docs.ts       # Docs loading + search index, locale-aware
vite.config.ts       # Two build-time copy plugins duplicate the dev-preview-only
                     #   short-form routes' output from their long-form
                     #   equivalent — see the Routes section above
utils/
  markdown.ts        # Frontmatter parser + MD→HTML
content/posts/       # Blog post markdown files
content/posts/<locale>/ # Translated posts, e.g. content/posts/zh/getting-started-with-honox.md
content/pages/       # Page builder JSON layouts (index.json is the homepage; blog.json/docs.json are just title+intro content for /blog and /docs, not their header — see content/docs/PageBuilder.md)
content/pages/<locale>/ # Translated page layouts, e.g. content/pages/zh/index.json
public/admin/        # Sveltia CMS static files
  config.yml          # CMS configuration
  index.html          # CMS UI
````
