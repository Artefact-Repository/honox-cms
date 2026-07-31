---
title: "[LLM Assist] in-browser WebGPU inference proof-of-concept (prod build)"
project: pms-llm
status: In Progress
priority: High
assignee: Diego Ramos
dueDate: 2026-12-15
tags:
  - pms
  - ai
  - local-inference
  - spike
---

Before any feature work, prove that on-device LLM inference actually runs inside *this* app's bundle — not just as a thought experiment. This de-risks the entire "local LLM Assist" idea, because the repo has no server runtime: it deploys to Cloudflare Pages (edge, static assets) + Vercel, and all writes happen client-side via `app/utils/git-backend.ts`. So inference MUST run in the browser.

**Tech decision (superseding the original ONNX Runtime Web / `@huggingface/transformers` plan):** went with `@mlc-ai/web-llm` instead. Both are legitimate; WebLLM won on two points that matter specifically for this feature: (1) its TVM-compiled decode kernels are generally faster than onnxruntime-web's WebGPU execution provider for the same model+quant, and (2) it ships a built-in OpenAI-style `chat.completions.create()` API with **JSON-schema-constrained (grammar) decoding** — `response_format: { type: "json_object", schema }` — which is what makes a 3B on-device model reliably emit valid, schema-conforming JSON instead of the malformed-output problem small models usually have. Building that constraint by hand on top of onnxruntime-web would have been real extra engineering. Trade-off accepted: WebLLM is WebGPU-only, no WASM/CPU fallback — `isWebGpuSupported()` gates the UI off entirely rather than degrading to a slow CPU path.

Done so far:
1. Added `@mlc-ai/web-llm` (dynamic-imported only inside `getEngine()` in `app/utils/ai-engine.ts` — never at module top-level, so it can't leak into the SSR/SSG bundle; see `pms-llm-docs`' build caveat).
2. Built a throwaway validation harness — `app/islands/ai-extraction-test.tsx` + `app/routes/tasks/ai-test.tsx` (delete both once this task and `pms-llm-bulk-create-from-doc` are done) — that loads `Qwen2.5-3B-Instruct-q4f16_1-MLC` and runs real extraction against a sample roadmap doc referencing this repo's actual project slugs.
3. Confirmed `navigator.gpu` and a real `requestAdapter()` succeed in a headless Chromium (via Playwright, `--enable-unsafe-webgpu --use-angle=swiftshader`) — proves the WebGPU path is reachable outside a full desktop browser session, which is a reasonable proxy for "this isn't fundamentally broken in this bundle."

Still open before this can close:
- Confirm actual end-to-end model load + generation quality in the harness (in progress — model download + multi-chunk extraction run against the sample doc).
- Bundle delta check: what `@mlc-ai/web-llm` adds to the client chunk when the AI drawer is never opened (should be ~0, since it's dynamic-imported) vs. when it is.
- Device matrix on a real GPU (not just software-rendered headless) — Chrome/Edge desktop at minimum.

Definition of done: a working in-browser generation call producing valid schema-constrained JSON, plus a written note on bundle delta + device support. If WebGPU inference turns out to be unreliable in this bundle, this task stops the rest of the initiative before UI gets built on a broken foundation.
