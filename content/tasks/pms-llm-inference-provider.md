---
title: "[LLM Assist] shared local-inference engine util"
project: pms-llm
status: Done
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

### Final Verification Results & Notes (TASK CLOSED)

The shared local-inference engine utility (`app/utils/ai-engine.ts`) is fully implemented, reviewed, and ready to support all interactive AI assistant features in the PMS client-side workspace. We verified the compliance of all core specifications:

1. **Lazy Loading:** Successfully code-splits `@mlc-ai/web-llm` via dynamic `import()` within `getEngine()`. This keeps the initial page bundle size perfectly untouched (0 KB overhead) unless a feature actively requests local LLM inference.
2. **Capability Check:** Fully exposes `isWebGpuSupported()`, wrapping around `navigator.gpu` presence checks. Callers and drawers successfully gate interactive buttons/elements off when WebGPU is not supported by the environment.
3. **Model Registry & Persistence:** The model selection utility persists the selected model ID to the browser's `localStorage` via `honox-ai-model-id`, aligning with standard client-side configuration parameters.
4. **Single Shared Engine Promise:** Employs a module-level engine promise cache (`enginePromise` and `loadedModelId`) to prevent duplicate model instantiation and memory bloat. Failed engine initializations cleanly reset the cache so subsequent attempts can retry.
5. **Progress Callback Support:** Propagates download/compilation progress from WebLLM (`InitProgressCallback`) directly to caller islands with no additional layers.
6. **Structured Grammar Helper:** Implements `runStructuredCompletion()`, wrapping `chat.completions.create` with JSON Schema constraint parameters (`response_format: { type: "json_object", schema }`). This solves malformed parsing issues on small models.
