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
- What LLM Assist does (write-up draft in `app/islands/task-create-drawer.tsx`; execution assist on `app/routes/tasks/[slug].tsx`; bulk-create-from-doc and prompt-driven edit on `/tasks`).
- Why it's local: no server runtime in this app (Cloudflare Pages edge + Vercel, static assets; all writes client-side via `app/utils/git-backend.ts`), so inference runs in-browser via `@mlc-ai/web-llm` (WebGPU only, no WASM/CPU fallback — see `pms-llm-inference-poc` for why WebLLM was chosen over ONNX Runtime Web/Transformers.js).
- The chosen model (`Qwen2.5-3B-Instruct-q4f16_1-MLC` default) + why, and how the picker in `pms-llm-settings-privacy` swaps it via `ai-engine.ts`'s `getStoredModelId()`/`setStoredModelId()`.
- The privacy model: task text never leaves the browser; weights download once and are cached by the browser (Cache Storage), not re-downloaded per session.
- Device requirements — WebGPU is mandatory, not preferred; there is no fallback path, and the opt-in setting in `pms-llm-settings-privacy` should say so plainly.
- **Build/SSG caveat for maintainers:** `@mlc-ai/web-llm` must only be dynamically imported inside `ai-engine.ts`'s `getEngine()` (never at module top-level, never in an SSR/route module) or it risks leaking into the SSG/SSR path. Unlike the `yaml`/`extend` CJS cases `vite.config.ts`'s `ssr.external` was built for, this one's avoided by discipline (dynamic import only) rather than needing an `ssr.external` entry — document why, so a future contributor doesn't "fix" it by adding one it doesn't need, or worse, add a top-level import.
