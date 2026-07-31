---
title: LLM Assist — settings, opt-in, and privacy notice
project: pms
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

Because local inference downloads ~100MB+ of weights (one-time, cached) and runs on the user's device, it must be **opt-in** and clearly explained. Add an "LLM Assist" section to `app/routes/settings/[section].tsx` (settings already exists; add a section key).

Controls:
- **Enable/disable** the feature (default **off**) — persisted in `localStorage`, consistent with the token-storage pattern in `app/utils/git-backend.ts` (`localStorage.setItem(TOKEN_STORAGE_KEY, ...)`). When off, `supportsLocalInference()`/UI buttons treat it as unavailable.
- **Model picker** — select from the registry defined in `pms-llm-inference-provider` (default `SmolLM2-1.1B-Instruct`; allow swapping if a smaller/larger local model is added).
- **Device support + status** — show whether WebGPU is available (and that WASM fallback exists), plus current model download/cache state.
- **Privacy banner** — a prominent, plain-language notice: "Runs 100% in your browser via ONNX. Your task content is never sent to any server." This is the core value prop of doing it locally and should be unmissable.

Constraints:
- The assist *drafting* works without a git token (it's local); only the *commit* actions (in `pms-llm-execution-assist`) require a token, so respect the existing `useGitToken()` gating there.
- Keep this section free of any remote-API toggle — the user explicitly wants local inference, so there is no "use a hosted model instead" fallback (a missing device path should disable the buttons with an explanation, not route to a server).
