# HonoX + PandaCSS + Sveltia CMS Starter

Full-stack [HonoX](https://github.com/honojs/honox) starter with type-safe CSS-in-JS ([PandaCSS](https://panda-css.com/)), and a Git-backed CMS ([Sveltia CMS](https://sveltiacms.app/)).

Live demo: [https://honox.chen.so](https://honox.chen.so)

---

## What's Inside

| Feature | Details |
|---|---|
| **Framework** | [HonoX](https://honox.dev) — meta-framework on Hono |
| **Styling** | [PandaCSS](https://panda-css.com) — type-safe, zero-runtime CSS-in-JS |
| **CMS** | [Sveltia CMS](https://sveltiacms.app) — Git-backed, runs at `/admin/` |
| **Blog** | Markdown posts in `content/posts/`, rendered at `/blog` |
| **SSG** | Static site generation via `@hono/vite-ssg` |
| **Deploy** | Cloudflare Pages (`wrangler.jsonc`) |

---

## Architecture

### Routes

| Route | File | Purpose |
|---|---|---|
| `/` | `app/routes/index.tsx` | Homepage |
| `/blog` | `app/routes/blog.tsx` | Post list with tag filtering |
| `/blog/tag/:tag` | `app/routes/blog/tag/[tag].tsx` | Tag-filtered post list (static) |
| `/blog/:slug` | `app/routes/blog/[slug].tsx` | Individual post |
| `/admin/` | `public/admin/index.html` | Sveltia CMS UI |

---

## Blog & CMS

### How it works

1. **Write** — Markdown files in `content/posts/*.md` with YAML frontmatter:
   ````markdown
   ---
   title: "My Post"
   date: "2026-07-04"
   description: "A summary..."
   tags: ["tutorial", "honox"]
   draft: false
   ---
   
   Post body in markdown...
   ````

2. **Manage** — Visit `/admin/` to edit posts via Sveltia CMS.

3. **Build** — `bun run build` generates:
   - `dist/blog/index.html` — post list
   - `dist/blog/[slug].html` — individual post pages
   - `dist/blog/tag/[tag].html` — tag-filtered post lists (static, no JS needed)

---

## CMS Setup

Sveltia CMS is configured in `public/admin/config.yml`. You can use it **locally** or with a **Git backend**:
- **GitHub:** `name: github`
- **GitLab:** `name: gitlab`
- **Bitbucket:** `name: bitbucket`
- **Azure:** `name: azure`

See [Sveltia CMS docs](https://github.com/sveltia/sveltia-cms) for details.

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

### Static File Serving

The dev server (`app/server.ts`) includes custom middleware to serve `/admin/*` static files from `public/`. This is required because HonoX intercepts all requests in dev mode.

If you add new static files to `public/admin/`, they'll be automatically served at `/admin/[filename]`.

---

## Documentation

Component docs are in `docs/`. Each component has its own file with props, examples, and notes.

---

## Project Structure

````
app/
  components/ui/    # Public component API
  islands/          # Client-side interactive islands
  routes/           # File-based routing
    blog.tsx         # Post list
    blog/[slug].tsx  # Individual post
    blog/tag/[tag].tsx  # Tag-filtered post list
utils/
  markdown.ts        # Frontmatter parser + MD→HTML
content/posts/       # Blog post markdown files
public/admin/        # Sveltia CMS static files
  config.yml          # CMS configuration
  index.html          # CMS UI
````

---

## SSG Notes

Dynamic routes are pre-generated at build time using `ssgParams` middleware:
- `app/routes/blog/[slug].tsx` → generates all `/blog/[slug]` pages
- `app/routes/blog/tag/[tag].tsx` → generates all `/blog/tag/[tag]` pages

The `fixSsgRoutingPlugin` in `vite.config.ts` handles SSG routing conflicts (e.g., `dist/blog.html` vs `dist/blog/index.html`).
