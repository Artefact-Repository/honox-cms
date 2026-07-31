---
title: PMS — LLM Assist (local inference)
summary: "Workstream that adds on-device LLM help to the Git-backed Projects &
  Tasks surface: task write-up drafting, execution assist, and prompt-driven
  bulk editing (e.g. turn an implementation roadmap doc into a batch of tasks).
  All inference runs in the browser via @mlc-ai/web-llm (WebLLM, WebGPU-only) —
  there is no server runtime in this app, so task text never leaves the device."
status: Active
colorPalette: gray
owner: Diego Ramos
startDate: 2026-08-01
dueDate: 2027-02-15
tags:
  - pms
  - ai
  - local-inference
---

Separate from the operational PMS programme (`content/projects/pms.md`). This is the LLM Assist initiative for the Projects & Tasks surface: run a small, quantized instruct model entirely client-side, because the app ships to Cloudflare Pages (edge, static assets) + Vercel and every write goes straight to the git host via `app/utils/git-backend.ts` — there is no backend to host inference.

Considered `@huggingface/transformers` (ONNX Runtime Web, WASM fallback available) as the alternative; went with `@mlc-ai/web-llm` instead because its TVM-compiled kernels decode faster on WebGPU and — the deciding factor for this feature — it has built-in JSON-schema-constrained (grammar) decoding via `response_format: {type: 'json_object', schema}`, which is what makes a 3B on-device model reliable enough for structured multi-task extraction. Trade-off accepted: WebGPU-only, no WASM/CPU fallback, so the assist UI simply hides itself when `navigator.gpu` is absent rather than degrading to a slow CPU path.

**Scope, in dependency order:**

1. A production-build proof-of-concept (`pms-llm-inference-poc`) that de-risks whether in-browser WebGPU inference even runs in this bundle — this gates the whole idea.
2. A shared client-only engine util (`pms-llm-inference-provider`) at `app/utils/ai-engine.ts`, plus the extraction/chunking logic at `app/utils/task-extraction.ts`.
3. Write-up drafting in the task-create drawer (`pms-llm-writeup-assist`).
4. Execution assist on the task detail page (`pms-llm-execution-assist`).
5. Prompt-driven bulk editing — ingest a roadmap/implementation doc and batch-create tasks, with a review grid and an atomic batched git commit, plus natural-language editing of existing items (`pms-llm-bulk-create-from-doc`, `pms-llm-bulk-preview-review`, `pms-llm-batch-commit`, `pms-llm-prompt-editor`).
6. An opt-in settings/privacy section (`pms-llm-settings-privacy`).
7. Documentation that avoids the doc-drift we already flagged (`pms-llm-docs`).

**Status:** Active — the PoC's core claim (WebGPU inference runs in this bundle) is validated; the engine/extraction utils exist and are being run against real documents to confirm output quality before the UI layer is built on top.
