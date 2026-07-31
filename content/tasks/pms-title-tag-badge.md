---
title: Render a leading "[TAG]" in task titles as a styled badge
project: pms
status: To Do
priority: Medium
assignee: Mia Chen
dueDate: 2026-10-30
tags:
  - pms
  - tasks
  - ux
  - engineering
---

Today a task title is just a plain string everywhere it renders. Many teams already prefix titles with a category token in brackets — e.g. `[Bug] Login button unresponsive`, `[FE] Add dark mode toggle`, `[Epic] CMS Page Builder` — but the app treats `[Bug]` as ordinary text, so the category carries zero visual weight and is easy to miss in a dense board.

The goal: detect a leading `[…]` token at the start of a task title and render it as a colored **Badge** prefix, with the rest of the title rendered as normal text. This is a pure display convention — the token stays part of the `title` string in `content/tasks/*.md` frontmatter, so **no schema change and no migration** are needed. It also pairs naturally with the LLM bulk-create flow (`pms-llm-bulk-create-from-doc`), which can emit tagged titles like `[Epic]` / `[Spike]` at scale.

## Where titles currently render (wire all of these)

- `app/islands/task-board.tsx:200` — `{task.title}` inside the card's `<Text>`. **Primary surface.**
- `app/islands/task-details-drawer.tsx:85` — `title={task?.title ?? ""}` (the Drawer header). Note this is a prop, not JSX children; split before passing.
- `app/islands/task-subtasks.tsx:105` — `{subtask.title}`.
- `app/islands/task-row-actions-menu.tsx:263` — `title={selectedTask.title}` (menu header).
- `app/islands/task-tree-dnd.tsx:54` — `el.getAttribute("data-task-title")` fallback (DnD tree).
- `app/routes/tasks/[slug].tsx` and `app/routes/projects/[slug].tsx` — the full-page `<h1>` title(s). Grep `task.title`/`project.*title` to confirm exact spots.

## Implementation outline

1. **Add a parser in `app/lib/tasks.ts`** (next to `slugifyTaskTitle` in `app/utils/task-save.ts`), e.g.:
   ```ts
   export function splitTitleTag(title: string): { tag?: string; rest: string } {
     const m = /^\s*\[([^\]\n]{1,24})\]\s*(.*)$/s.exec(title);
     return m ? { tag: m[1], rest: m[2] || "" } : { rest: title };
   }
   ```
   Caps the inner token at a sane length (24 chars) and requires it to be at the very start with a closing `]`. A title that is *only* `[Tag]` (no rest) is valid — render the badge alone.
2. **Render helper** — a small `TaskTitle` component (or inline in each site) that returns `<><Badge variant="subtle" size="sm" colorPalette={colorFor(tag)}>{tag}</Badge> <span>{rest}</span></>` using the existing `app/components/ui/badge.tsx` (`Badge` already supports `variant`/`size`/`colorPalette`, matching the board's existing badge usage).
3. **Optional color map** — default neutral badge for any tag; allow a small known-tag → palette map (e.g. `[Bug]`→`red`, `[FE]`→`blue`, `[Epic]`→`purple`) seeded in `app/lib/pms-config.ts` or the existing `keyvalue` color-override mechanism so it stays CMS-editable. Unknown tags fall back to neutral — never break rendering.
4. **Preserve on edit** — the create/edit surfaces (`app/islands/task-create-drawer.tsx`, `app/islands/task-editable-text.tsx`, `app/islands/task-details-drawer.tsx`) must keep the `[Tag]` prefix intact in the title string; do **not** strip it, and do not let the badge become an editable field unless we later want that. The slug from `slugifyTaskTitle` may keep the tag — acceptable, no change required.

## Edge cases to cover
- `[` present but not at the very start → render as plain title (no badge).
- Unbalanced `[` or `]` → plain title.
- Token over the length cap → plain title (avoid layout blowups).
- Title is exactly `[Tag]` with empty rest → badge only, no dangling space.
- i18n: tag is author-controlled text, not translated; leave as-is.

## Acceptance
- A task titled `[Bug] Login broken` shows a red "Bug" badge followed by "Login broken" on the board, drawer, subtasks, row menu, tree, and full page.
- Titles without a leading `[…]` render exactly as before (zero regression).
- No change to `content/tasks/*.md` files is required to adopt the feature.
