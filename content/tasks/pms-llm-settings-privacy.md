---
title: "[LLM Assist] settings, opt-in, and privacy notice"
project: pms-llm
status: To Do
priority: Medium
assignee: Priya Nair
dueDate: 2027-01-31
tags:
  - pms
  - ai
  - local-inference
  - settings
---

Because local inference downloads ~2GB of model weights (one-time, cached in the browser's Cache Storage) and runs on the user's device, it must be **opt-in** and clearly explained. Add an "LLM Assist" section to `app/routes/settings/[section].tsx` (settings already exists; add a section key).

Controls:
- **Enable/disable** the feature (default **off**) — persisted in `localStorage`, consistent with the token-storage pattern in `app/utils/git-backend.ts` (`localStorage.setItem(TOKEN_STORAGE_KEY, ...)`). When off, treat every AI entry point as unavailable regardless of what `isWebGpuSupported()` (`app/utils/ai-engine.ts`) says.
- **Model picker** — `ai-engine.ts` already has the storage half of this (`getStoredModelId()`/`setStoredModelId()`, key `honox-ai-model-id`, default `Qwen2.5-3B-Instruct-q4f16_1-MLC`); this task adds the actual UI dropdown. Offer at least one lighter alternative (`Qwen2.5-1.5B-Instruct-q4f16_1-MLC`) for lower-end devices — keep the list tiny, these are the only sizes that are actually usable on-device.
- **Device support + status** — show whether WebGPU is available (`isWebGpuSupported()`), and the current model's download/cache state. No WASM/CPU fallback exists for WebLLM — if WebGPU is unavailable, say so plainly rather than implying a fallback path exists.
- **Privacy banner** — a prominent, plain-language notice: "Runs 100% in your browser via WebGPU. Your task content is never sent to any server." This is the core value prop of doing it locally and should be unmissable.

Constraints:
- The assist *drafting/suggesting* works without a git token (it's local); only the *commit* actions (in `pms-llm-execution-assist`, `pms-llm-batch-commit`) require a token, so respect the existing `useGitToken()` gating there.
- Keep this section free of any remote-API toggle — the user explicitly wants local inference, so there is no "use a hosted model instead" fallback (a missing device path should disable the buttons with an explanation, not route to a server).
