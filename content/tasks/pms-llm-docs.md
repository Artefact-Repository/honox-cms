---
title: "[LLM Assist] document the local-inference feature (and avoid doc drift)"
project: pms-llm
status: To Do
priority: Low
assignee: Mia Chen
dueDate: 2027-02-15
tags:
  - pms
  - ai
  - local-inference
  - docs
---

Add an "LLM Assist (local inference)" section to `content/docs/PMS.md` describing the feature once it ships. This intentionally ties to `pms-doc-code-drift-sync` — the PMS doc already over-claims project clone/delete parity (lines 73/92), so we must document what *actually* ships here, not aspirational behavior.

Document:
- What LLM Assist does (write-up draft in `app/islands/task-create-drawer.tsx`; execution assist on `app/routes/tasks/[slug].tsx`).
- Why it's local: no server runtime in this app (Cloudflare Pages edge + Vercel, static assets; all writes client-side via `app/utils/git-backend.ts`), so inference runs in-browser via `@huggingface/transformers` (ONNX Runtime Web), WebGPU with WASM fallback.
- The chosen model(s) + why (small, quantized, on-device), and how to add one to the registry in `pms-llm-inference-provider`.
- The privacy model: task text never leaves the browser; weights download once from the HF Hub CDN.
- Device requirements (WebGPU preferred, WASM fallback) and the opt-in setting in `pms-llm-settings-privacy`.
- **Build/SSG caveat for maintainers:** the lib must only be dynamically imported inside client islands (never an SSR/route module) or it leaks into the SSG/SSR path — reference the `ssr.external` pattern in `vite.config.ts`. This stops a future contributor from naively top-level importing it and breaking the build.
