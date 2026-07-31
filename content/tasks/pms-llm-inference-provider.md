---
title: LLM Assist — shared local-inference provider util
project: pms
status: To Do
priority: Medium
assignee: Diego Ramos
dueDate: 2026-12-31
tags:
  - pms
  - ai
  - local-inference
  - engineering
---

Build the single shared inference engine the write-up and execution assists both call, so we don't instantiate the ONNX pipeline twice. Depends on `pms-llm-inference-poc` landing first.

Create `app/utils/llm-inference.ts` (client-only — never imported by any SSR/route module):
1. **Lazy load only.** Never `import` `@huggingface/transformers` at module top. Wrap it in a function that does `await import('@huggingface/transformers')` on first use, so it stays out of the SSG/SSR bundle (same discipline `vite.config.ts` uses for `yaml`/`extend`).
2. **Device selection.** Try `device: 'webgpu'`, fall back to `'wasm'` if `navigator.gpu` is absent or init throws.
3. **Model registry.** A small exported map of allowed local models (default `SmolLM2-1.1B-Instruct` q4; leave room for the picker in `pms-llm-settings-privacy` to select among them). Keep the list tiny — these are the only ones that fit on-device.
4. **Single shared pipeline.** Lazily construct one `pipeline('text-generation', ...)` session and reuse it across calls; don't re-init per request.
5. **Progress + cancellation.** Accept an `onProgress(downloadPct)` callback (weights download once but should show a bar) and an `AbortSignal` so the UI can cancel generation.
6. **Capability check.** Export `supportsLocalInference(): boolean` — true only when not in SSR AND `fetch` is available AND (WebGPU or WASM is viable). This is what the UI uses to decide whether to show the assist buttons at all.

This is the foundation for `pms-llm-writeup-assist` and `pms-llm-execution-assist`. Keep it dependency-free of any UI primitive; it should be callable from any island.
