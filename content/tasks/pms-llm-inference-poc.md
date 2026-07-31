---
title: LLM Assist — in-browser ONNX inference proof-of-concept (prod build)
project: pms-llm
status: To Do
priority: High
assignee: Diego Ramos
dueDate: 2026-12-15
tags:
  - pms
  - ai
  - local-inference
  - spike
---

Before any feature work, prove that on-device LLM inference actually runs inside *this* app's production bundle — not just `bun dev`. This de-risks the entire "local LLM Assist" idea, because the repo has no server runtime: it deploys to Cloudflare Pages (edge, static assets) + Vercel, and all writes happen client-side via `app/utils/git-backend.ts`. So inference MUST run in the browser.

Do:
1. Add `@huggingface/transformers` (Transformers.js). It runs **ONNX Runtime Web** under the hood — exactly the "HuggingFace + ONNX" the user named. Do NOT add a server-side runtime.
2. Create a throwaway island that **dynamic-imports** the lib, then loads a small instruction model — `SmolLM2-1.1B-Instruct` (q4 ONNX) or `Qwen2.5-0.5B-Instruct` — and runs one short generation (e.g. "Write a one-line task description for: fix login button").
3. Verify against the *deployed* build, not dev: `bun run build` (the two-stage `vite build --mode client && vite build` in package.json) then `wrangler dev`/preview, open in a WebGPU-capable browser (Chrome/Edge, recent Safari), and confirm tokens stream out.

Report back on:
- **Bundle delta** — what `@huggingface/transformers` + `onnxruntime-web` add to the client chunk, and whether anything leaked into the SSR/SSG path (see `vite.config.ts` `ssr.external` — it already externalizes `yaml`/`extend` for exactly this class of CJS/ESM problem; ONNX may need the same).
- **Model download size + cold-start** time (first load pulls weights from the HF Hub CDN; one-time, cached).
- **Device support matrix** — WebGPU vs WASM fallback, and generation latency on each.
- Whether `navigator.gpu` exists in the target browsers and whether WASM fallback is acceptable.

Definition of done: a working in-browser generation call in the production build, plus a written note capturing the bundle delta + device matrix. If the prod bundle can't run it (SSR leak, worker/CORS, etc.), this task stops the rest of the initiative before we build UI on a broken foundation.
