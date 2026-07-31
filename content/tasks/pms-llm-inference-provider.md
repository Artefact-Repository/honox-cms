---
title: "[LLM Assist] shared local-inference engine util"
project: pms-llm
status: In Progress
priority: Medium
assignee: Diego Ramos
dueDate: 2026-12-31
tags:
  - pms
  - ai
  - local-inference
  - engineering
---

Build the single shared inference engine every AI-assisted feature calls into, so we don't instantiate the model twice. Depends on `pms-llm-inference-poc`. Superseded the original `app/utils/llm-inference.ts` (Transformers.js/ONNX) plan — see that task for the WebLLM decision.

`app/utils/ai-engine.ts` now exists with:
1. **Lazy load only.** `@mlc-ai/web-llm` is `await import()`ed inside `getEngine()`, never at module top — keeps it out of the SSG/SSR bundle entirely (no `vite.config.ts` `ssr.external` entry needed, since it's never touched server-side at all, unlike the `yaml`/`extend` CJS cases that pattern was built for).
2. **Capability check.** `isWebGpuSupported()` — `'gpu' in navigator`. No WASM/CPU fallback exists for WebLLM, so this is a hard gate, not a soft degrade: `getEngine()` throws immediately if it's false, and callers should check it before even offering the AI buttons.
3. **Model registry.** `DEFAULT_MODEL_ID = "Qwen2.5-3B-Instruct-q4f16_1-MLC"`, plus `getStoredModelId()`/`setStoredModelId()` persisting the user's pick to `localStorage` (`honox-ai-model-id` key, same convention as `git-backend.ts`'s `TOKEN_STORAGE_KEY`). The actual picker UI is `pms-llm-settings-privacy`'s job; this just stores/reads the choice.
4. **Single shared engine.** `getEngine(modelId, onProgress)` is a module-level singleton promise, reloaded only if a different `modelId` is requested; a failed load clears the cached promise so the next attempt retries instead of failing forever.
5. **Progress.** `onProgress({ progress, text })` mirrors WebLLM's own `InitProgressCallback` — no re-wrapping needed. No `AbortSignal` yet (WebLLM's own API doesn't take one for `chat.completions.create`; cancellation would need to be modeled at the call-site level — open question for whoever builds the first UI on top).
6. **Structured completion helper.** `runStructuredCompletion(engine, systemPrompt, userPrompt, schema)` — the shared low-level call `pms-llm-bulk-create-from-doc`'s extraction and `pms-llm-prompt-editor`'s edit-ops both build on, using `response_format: { type: "json_object", schema }` for grammar-constrained JSON output.

Not yet built: cancellation, and the model registry is currently a single default rather than a real multi-model list — both are fine to defer to `pms-llm-settings-privacy`.

This is the foundation for `pms-llm-writeup-assist` and `pms-llm-execution-assist`. Kept dependency-free of any UI primitive; callable from any island.
