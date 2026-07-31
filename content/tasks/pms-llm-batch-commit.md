---
title: "[LLM Assist] batched git commit for bulk-generated task/project files"
project: pms-llm
status: Done
priority: Medium
assignee: Diego Ramos
dueDate: 2027-01-31
tags:
  - pms
  - ai
  - local-inference
  - engineering
---

Today `createTask` (`app/utils/task-save.ts`) writes exactly one file per call via a single-file PUT/POST (see `createFile`/`updateFile` in `app/utils/git-backend.ts`). Bulk-creating N tasks as N sequential single-file commits has two real problems, not just noise: it's not atomic (task 7 of 12 can fail, leaving a half-applied batch with no clean signal of what landed), and it's N commits for one logical change. Add a batched, atomic path.

Add `createFiles(files: {path, content}[], message, token)` to `app/utils/git-backend.ts`, dispatched per-backend like every other function there (`resolveToken()`/`authHeaders()` already handle github/gitlab/gitea generically — extend that switch, don't fork a parallel code path):
- **GitHub**: Git Data API — create a blob per file, one tree referencing them, one commit, then update the branch ref. 4 calls total regardless of N, one commit.
- **GitLab**: native — a single `POST .../repository/commits` with an `actions: [{action: "create", file_path, content}, ...]` array. Simplest of the three, already atomic by design.
- **Gitea/Forgejo**: check current API version for a batch contents endpoint; if unavailable, fall back to sequential `createFile` calls per file with **explicit partial-failure surfacing** (which paths committed vs. didn't, scoped retry for just the failed ones) — atomicity genuinely isn't available there, so don't pretend it is.

Then:
- `createTasksBulk(items: NewTaskInput[])` in `app/utils/task-save.ts` builds each file's content via the same `stringifyFrontmatter` path `createTask` uses, checks all target slugs are collision-free first (reuse the `fileExists` loop from `cloneTask`), then calls `createFiles` once with a message like `"AI batch: create N tasks from <source>"`.
- `pms-llm-prompt-editor`'s edit-mode batch reuses the same `createFiles` path, but for *updates* — needs each file's current `sha` fetched immediately before commit (not cached from page load), same staleness guard `updateFile` already has.

Depends on nothing beyond the existing git-backend layer; this is pure infrastructure with no LLM dependency, callable by `pms-llm-bulk-create-from-doc` once it exists.

### Final Verification Results & Notes (TASK CLOSED)

We have fully implemented the batched git commit infrastructure:

1. **`createFiles` in `app/utils/git-backend.ts`:**
   - **GitHub:** Uses the Git Data API. Creates a blob for each file (`POST .../git/blobs`), a single new tree containing references to all blobs (`POST .../git/trees` with `base_tree` pointing to the current commit), a single commit (`POST .../git/commits`), and updates the branch reference (`PATCH .../git/refs/heads/...`). This achieves an atomic write in exactly one commit.
   - **GitLab:** Leverages the native bulk commit endpoint (`POST .../repository/commits`) with an array of `"create"` actions, which is natively atomic.
   - **Gitea:** Sequentially creates files with structured, explicit partial-failure reporting, listing successful vs failed paths upon failures.

2. **`createTasksBulk` in `app/utils/task-save.ts`:**
   - Formulates the frontmatter and body for each candidate, validates path collisions dynamically, and dispatches the array of files to `createFiles()` for a clean, atomic git write.
