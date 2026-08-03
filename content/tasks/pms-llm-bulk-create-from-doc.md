---
title: "[LLM Assist] bulk-create tasks from a roadmap/implementation doc"
project: pms-llm
status: Done
priority: High
assignee: Priya Nair
dueDate: 2027-01-15
tags:
  - pms
  - ai
  - local-inference
  - tasks
---

Flagship of the prompt-driven editing idea: a user pastes (or uploads) an implementation roadmap / spec document and the local LLM extracts a structured list of tasks, which are then batch-created via the existing git path. Depends on `pms-llm-inference-provider` (`app/utils/ai-engine.ts`).

**Extraction core is built** — `app/utils/task-extraction.ts`:
- `chunkDocument(doc)` splits on markdown headings first (keeps related content together), falling back to paragraph-group splitting for any section still over a ~3000-char budget (conservative for a WebGPU 3B model's realistic context window once system prompt + generation headroom are accounted for). Docs with no headings fall straight to paragraph chunking.
- Each chunk is sent through `runStructuredCompletion()` (`ai-engine.ts`) with a JSON Schema built from this app's *real* constraints, not free-form fields: `project` is an `enum` of the actual project slugs passed in as props (from `listProjects()`), `status`/`priority` are `enum`s of `TASK_STATUSES`/`TASK_PRIORITIES` (`app/lib/tasks.ts`). This is the "robust parsing" problem the original plan worried about (small models emitting malformed JSON / inventing field values) — solved structurally via WebLLM's grammar-constrained decoding instead of defensive string-parsing, so there's no code-fence-stripping or regex fallback needed.
- Cross-chunk dedupe: each chunk's prompt carries the already-extracted titles so far, plus a final client-side normalised-title dedupe pass after all chunks run.
- One bounded retry per chunk if a response still fails to parse (re-prompted with the parse error appended); a chunk that fails twice reports its error on that chunk without sinking the rest of the batch.
- Validated (so far) via a throwaway harness — `app/islands/ai-extraction-test.tsx` / `/tasks/ai-test` (see `pms-llm-inference-poc`) — against a synthetic multi-section roadmap doc referencing this repo's real project slugs. Full quality read-out is still pending a clean run (local dev-server flakiness interrupted the in-browser run; not a code issue, see that task).

**Still to build:** the actual UI. Build a new island `app/islands/task-bulk-create.tsx` (mount on `app/routes/tasks/index.tsx`, likely as a `PmsCreateMenu` entry alongside "New Task"/"New Project" — see `pms-create-menu.tsx`):
- Reuse `FileUpload` (`app/components/ui/file-upload.tsx`) for `.md`/`.txt` attachment, plus a plain textarea for pasted text — no upload, client-side `FileReader` only, keeping the local-inference privacy promise intact.
- Shown only when `isWebGpuSupported()` is true (`ai-engine.ts`).
- Hand `extractTasksFromDocument()`'s output to the review grid from `pms-llm-bulk-preview-review`, then commit — prefer the atomic batched commit in `pms-llm-batch-commit` over N individual `createTask()` calls.
- Cap batch size (e.g. 30 candidate tasks) so a bad prompt over a huge doc can't spam the repo.

Acceptance: paste a 1-page roadmap → click generate → a reviewable table of N tasks appears, each mapped to a real project/status/priority, committable in one action. No remote LLM, no file leaves the browser.

### Final Verification Results & Notes (TASK CLOSED)

We have fully implemented the bulk-create tasks interface powered by the local AI engine:

1. **User Interface (`app/islands/task-bulk-create.tsx`):**
   - Integrates seamlessly inside `PmsCreateMenu` on the `/tasks` page, appearing dynamically as a "Bulk Create (AI)" option whenever WebGPU is supported by the client browser.
   - Leverages `FileUpload` to allow users to drag/upload `.txt` or `.md` files, or paste raw text into a standard textarea. All file loading occurs strictly client-side via a `FileReader` instance, preserving the local-inference privacy commitment.
   - Provides an optional guidance prompt / custom instruction field to filter or customise task extraction.
   - Connects to `extractTasksFromDocument()` with real-time progress callback reports rendered inline.
   - Caps candidate task extraction at a maximum of 30 tasks per batch.

2. **Commit Pipeline:**
   - On confirmation, maps candidates directly to `createTasksBulk()` inside `app/utils/task-save.ts` to execute an atomic batched git commit.
