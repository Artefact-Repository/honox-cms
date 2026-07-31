---
title: Audit PMS write gating (create/delete must be token-gated, not just disabled)
project: pms
status: To Do
priority: Low
assignee: Diego Ramos
dueDate: 2026-11-01
tags:
  - pms
  - security
  - engineering
---

Every PMS mutation is gated by a git token resolved in `app/utils/git-backend.ts` (`resolveToken()`): Sveltia's own session first, then a manually-pasted personal access token, with `requireToken()` throwing if neither exists. The UI honours this two ways — `PmsCreateMenu` (`app/islands/pms-create-menu.tsx`) returns `null` when there's no token (no button at all, not a disabled one), and `task-save.ts` calls `requireToken()` defensively before any network call. Destructive ops also surface a confirm dialog (`TaskDeleteDialog`, `role="alertdialog"`).

As new project mutations land (Delete Project, and any inline Edit), confirm they follow the same contract rather than introducing a weaker path:

1. **No token → no UI.** The new project delete/edit buttons must not render when `useGitToken()` is empty (mirror `PmsCreateMenu`'s `if (!token) return null`), not merely be `disabled`. A disabled button still reveals the capability and can be re-enabled via devtools.
2. **Defensive `requireToken()` in the save util.** `deleteProject` / `updateProject` must call `requireToken()` before touching `git-backend`, like every function in `task-save.ts`.
3. **Consider a stricter gate for destructive ops.** Any token holder can currently create *and* (once added) delete — there's no role distinction. Deleting a project has real blast radius (removes a file + orphans tasks, see the orphan-handling task). Decide whether delete should require anything beyond a valid token (e.g. a confirming second step is already in the dialog; a scoped token check is likely overkill for a personal/example repo, but the decision should be explicit, not accidental).

Low priority — the existing pattern is sound; this is a guardrail review so the new paths don't regress it.
