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
3. Ran the harness end-to-end in headless Chromium (Playwright, `--enable-unsafe-webgpu --use-angle=swiftshader`, software-rendered — no real GPU available in that environment) and got three data points, in order:
   - `Qwen2.5-3B-Instruct-q4f16_1-MLC`: adapter created fine, model download streamed correctly to ~890MB/1.9GB, then failed with a `Cache.add(): Quota exceeded` error — that sandbox's storage quota (14GB free on a 93%-full disk) wasn't the limiter directly; the ephemeral/temp browser profile Playwright allocates per run is. Real desktop Chrome profiles don't have this constraint.
   - `Qwen2.5-1.5B-Instruct-q4f16_1-MLC`: fit under the quota (829MB) and loaded fully, but generation failed immediately: `Extension f16 is not allowed on the Device` — the `q4f16_1` quantization needs WebGPU's `shader-f16` feature, which SwiftShader's software rasterizer doesn't expose. Virtually all real GPUs do.
   - `Qwen2.5-1.5B-Instruct-q4f32_1-MLC`: loaded fully (no f16 dependency) and **generation actually started** (`chat.completions.create()` with the JSON-schema `response_format` was reached and began decoding) — but didn't finish within 15 minutes on software-rendered compute, so no output was captured. LLM decode on a CPU-emulated GPU is roughly two orders of magnitude slower than real hardware; this is expected, not a code defect.

**Conclusion: every layer up to and including "the model is generating tokens against a schema-constrained prompt" is proven to work in this bundle.** What's *not* yet proven is output quality/latency, and that genuinely requires a real GPU — sandboxed/headless CI-style environments without GPU passthrough cannot validate this part. 

Still open before this can close:
- Run the harness (`/tasks/ai-test`) in an actual desktop Chrome/Edge with real GPU hardware and confirm the extraction output is sane against the sample roadmap doc — 5-10 minutes of manual testing, blocked only on having that environment available, not on any more code.
- Once that's done: bundle delta check (what `@mlc-ai/web-llm` adds to the client chunk when the AI drawer is never opened — should be ~0, since it's dynamic-imported — vs. when it is), and note the real device matrix (WebGPU + `shader-f16` support across current browsers).

Definition of done: a working in-browser generation call producing valid schema-constrained JSON on real hardware, plus a written note on bundle delta + device support. If quality turns out to be unacceptably poor even on real hardware, this task stops the rest of the initiative before UI gets built on a broken foundation — but nothing so far points that way.
