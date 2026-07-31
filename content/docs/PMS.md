---
title: Projects & Tasks (PMS Example)
---

`/projects` and `/tasks` are a small **Git-backed project management example** — a second, differently-shaped content collection built on the exact same "content lives as files, CMS edits the files, SSG renders the files" pattern as the blog and Page Builder, to show that pattern isn't specific to marketing pages.

Both projects and tasks live as markdown-with-frontmatter — `content/projects/*.md` and `content/tasks/*.md` — so each entry's description can be real formatted markdown, like a blog post's body. Both collections are ordinary Sveltia CMS collections, editable at `/admin/` (**Projects** / **Tasks**) exactly like posts or pages. There is no database, no server-side write endpoint, and no drag-and-drop persistence layer in the usual sense — see "Direct-to-Git Writes" below for how board/inline edits actually get committed.

---

## Routes

| Route | File | Purpose |
|---|---|---|
| `/projects` | `app/routes/projects/index.tsx` | Project list — cards with a live done/total progress bar per project |
| `/projects/:slug` | `app/routes/projects/[slug].tsx` | One project's tasks, as a **Board** (`Tabs`) or **List** (`Table`) view |
| `/tasks` | `app/routes/tasks/index.tsx` | Full task table — search, sortable Status/Priority columns, row-hover actions |
| `/tasks/:slug` | `app/routes/tasks/[slug].tsx` | Task detail — inline-editable title/description, project picker |
| `/tasks/by-project/:project` | `app/routes/tasks/by-project/[project].tsx` | Tasks filtered to one project (static) |
| `/tasks/by-assignee/:assignee` | `app/routes/tasks/by-assignee/[assignee].tsx` | Tasks filtered to one assignee (static) |
| `/tasks/by-status/:status` | `app/routes/tasks/by-status/[status].tsx` | Tasks filtered to one status (static) |
| `/tasks/by-priority/:priority` | `app/routes/tasks/by-priority/[priority].tsx` | Tasks filtered to one priority (static) |

All eight routes are statically generated (`ssgParams` enumerates every project/task slug and every status/priority/assignee value at build time), same as every other collection in this starter.

---

## Content Shape

### Projects (`content/projects/*.md`)

```markdown
---
title: Website Redesign
summary: Refresh the marketing site's visual language.
status: Active
colorPalette: blue
owner: Priya Shah
startDate: 2026-06-01
dueDate: 2026-09-15
tags: [design, web]
---

Full rebuild of the public site on the new design system.
```

`status` is one of `Planning` / `Active` / `On Hold` / `Completed` / `Archived`; `colorPalette` drives the project's badge/progress-bar accent (`PROJECT_STATUS_COLOR` in `app/lib/projects.ts` also maps each status to a default color for badges elsewhere). The markdown body is the project description, parsed with the same frontmatter/markdown pipeline as tasks (`app/utils/markdown.ts`). Loaded via `listProjects()` / `loadProjectBySlug()` / `listProjectSlugs()`.

### Tasks (`content/tasks/*.md`)

```markdown
---
title: Migrate color tokens to v2
project: design-system-v2
status: In Progress
priority: High
assignee: Priya Shah
dueDate: 2026-08-01
tags: [tokens, breaking-change]
---

Move every component off the old `colorPalette` recipe variant and onto
the shared `colorPaletteClass()` utility...
```

`project` is a **`relation` widget** in `config.yml` (`collection: projects`, `value_field: "{{slug}}"`) — the CMS resolves it to a picker over existing projects, but on disk it's just the related project's slug as a plain string, so a hand-authored file works the same way. `status` is one of `To Do` / `In Progress` / `In Review` / `Done`; `priority` is one of `Low` / `Medium` / `High` / `Urgent`. The markdown body is the task description, parsed with the same frontmatter/markdown pipeline as blog posts (`app/utils/markdown.ts`). Loaded via `listTasks()` / `listTasksByProject()` / `loadTaskBySlug()` / `listTaskSlugs()`, all in `app/lib/tasks.ts`.

Neither collection is translated — `content/projects/` and `content/tasks/` have no `<locale>/` subfolders, unlike posts/pages/docs, since this is operational data rather than localized marketing content.

---

## Direct-to-Git Writes

Everywhere on `/projects` and `/tasks` that looks editable in place — dragging a card between board columns, the task title/description's click-to-edit, the project picker on a task's detail page, "+ New" task/project, clone, delete — commits **straight to the `main` branch** via the Git host's REST API, called directly from the browser. There is no server-side write endpoint; the deployed site is fully static, so this is the only way an in-page edit can persist at all.

This mirrors exactly how Sveltia CMS itself publishes when `backend` isn't configured for an editorial workflow (see `public/admin/config.yml`'s `backend` key) — same "read file → edit → commit" shape, just invoked from application UI instead of the CMS's own editor.

**Token resolution** (`app/utils/git-backend.ts`, `resolveToken()`), in order:
1. **Sveltia's own logged-in session** — if the same browser is logged into `/admin/`, its OAuth token is read straight out of `localStorage['sveltia-cms.user']` (unofficial, since Sveltia is loaded unpinned from a CDN — this key could change on any Sveltia release).
2. **A manually-pasted personal access token** — the fallback UI shown on `/tasks/:slug` and the task board when no Sveltia session exists; stored under the app's own `localStorage` key. Needs whatever scope the configured backend requires for repo contents read/write (GitHub: `repo` or fine-grained Contents; GitLab: `api`; Gitea/Forgejo: `repo`).

**Backend support**: GitHub, GitLab (gitlab.com or self-hosted via `base_url`), and Gitea/Forgejo (self-hosted, `base_url` required) — the same three Sveltia itself supports, read from `backend.name`/`backend.repo`/`backend.branch`/`backend.base_url` in `public/admin/config.yml` (fetched at runtime, not duplicated in app code, so it can't drift). GitHub and gitlab.com serve permissive CORS headers so this works with no extra setup; a self-hosted Gitea/Forgejo instance needs CORS enabled by its admin or every request fails as an opaque network error.

**Write model**: every edit does a read-modify-write against the Contents API — fetch the current file + blob SHA, patch just the field that changed (frontmatter for both tasks and projects), `PUT`/`POST`/`DELETE` it back with a descriptive commit message (e.g. `Move "Migrate color tokens to v2" to Done`). A conflicting SHA (someone else committed to the same file first) surfaces as "File changed on the remote since it was last read — reload and retry," rather than silently overwriting. Every commit lands on `main` directly — there's no PR/preview step — so the edit is only "live" once the static site rebuilds and redeploys.

If no token is available yet, editors fall back to a **read-only state with a link into `/admin/`** so the underlying content can still be changed the normal CMS way.

### Where this shows up

* **`TaskBoard`** (`app/islands/task-board.tsx`, used by `/projects/:slug`'s Board tab) — dragging a card to a new column patches that task's `status` frontmatter field and commits.
* **`TaskEditableText`** / **`TaskProjectEditor`** (`/tasks/:slug`) — click-to-edit title, description body, and project relation, each committing just that field via `app/utils/task-save.ts`'s `saveTaskField`.
* **`TaskCreateDrawer`** / **`ProjectCreateDrawer`** (behind the header's **+ New** button, `PmsCreateMenu`) — create a new task/project file via the Contents API's create path (no `sha`, so it 409s instead of clobbering if the slug's already taken).
* **`TaskCloneDialog`** / **`TaskDeleteDialog`** (the task detail page's "…" menu, and `/tasks`' row-hover actions) — copy or delete a task file.

### Nested-island pattern for row-hover actions

`/tasks`' table has a sortable Status/Priority column (`TableSortIsland`), which hydrates by **cloning already-rendered DOM** rather than re-executing it — so a live island can't be mounted directly inside a row's `hoverActions` or `column.render`, it would just be inert cloned markup. `TaskDetailsDrawer`, `TaskCloneAction`, and `TaskDeleteConfirm` work around this the same way: each row renders only a static trigger button (`[data-task-details-trigger]` / `[data-task-clone-trigger]` / `[data-task-delete-trigger]` + a `data-task-slug`), and one singleton island per action, mounted once outside the table, listens for clicks via delegation and looks the task up from its own `tasks` prop. See `app/routes/tasks/index.tsx`'s `Table`'s `hoverActions` for the trigger markup.

---

## Progress & Filtering

* **Project progress bars** (`/projects`, and the `Progress` bar on `/projects/:slug`) are computed live from `listTasks()`/`listTasksByProject()` — `done = tasks.filter(t => t.status === "Done").length` — not stored on the project itself, so they can never drift from the actual task data.
* **Search** on `/tasks` and `/projects/:slug` reuses the same `Search` island and `filterEntries`/`buildHaystack` utilities as blog/docs search (`app/utils/search.ts`), server-filtered for the no-JS `?q=` fallback and client-broadened via `buildTaskSearchEntries()`.
* **`/tasks/by-*/:value`** routes are thin: each loads `listTasks()` and filters in-memory by the one field named in the route, giving shareable static URLs (e.g. linking a Status badge on `/tasks` to `/tasks/by-status/In%20Progress`) without needing a query-string-driven route.
