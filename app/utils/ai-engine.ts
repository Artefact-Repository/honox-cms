// Local-inference engine for AI-assisted task creation/editing (see
// task-extraction.ts) — runs entirely in the browser via WebGPU, same
// "nothing leaves the client" posture as the direct-to-git write path
// (git-backend.ts). No server, no API key, no cloud call.
//
// @mlc-ai/web-llm is dynamically imported (never at module top-level) so its
// ~1MB+ JS doesn't ship to every /tasks page load — only pages that actually
// open the AI drawer pay for it.

import type { MLCEngine } from "@mlc-ai/web-llm";

export const DEFAULT_MODEL_ID = "Qwen2.5-3B-Instruct-q4f16_1-MLC";
const MODEL_STORAGE_KEY = "honox-ai-model-id";

export function getStoredModelId(): string {
	if (typeof localStorage === "undefined") return DEFAULT_MODEL_ID;
	return localStorage.getItem(MODEL_STORAGE_KEY) || DEFAULT_MODEL_ID;
}

export function setStoredModelId(modelId: string): void {
	localStorage.setItem(MODEL_STORAGE_KEY, modelId);
}

/** Whether this browser can run WebGPU inference at all — WebLLM has no CPU
 * fallback, so this is checked before anything else in the AI drawer, same
 * "no capability → no button" pattern as `useGitToken()` gating write UI. */
export function isWebGpuSupported(): boolean {
	return typeof navigator !== "undefined" && "gpu" in navigator;
}

export interface EngineProgress {
	/** 0-1, or -1 once generation (not loading) is underway. */
	progress: number;
	text: string;
}

let enginePromise: Promise<MLCEngine> | null = null;
let loadedModelId: string | null = null;

/** Lazily creates (or returns the already-loaded) singleton WebLLM engine.
 * Reloads if the caller asks for a different model than what's currently
 * loaded. First load per model downloads it into the browser's Cache
 * Storage; every load after that is a fast cache hit (WebLLM's own
 * `hasModelInCache` handles this, not reimplemented here). */
export async function getEngine(
	modelId: string,
	onProgress?: (report: EngineProgress) => void,
): Promise<MLCEngine> {
	if (!isWebGpuSupported()) {
		throw new Error(
			"This browser doesn't support WebGPU — try a recent Chrome or Edge.",
		);
	}

	if (enginePromise && loadedModelId === modelId) {
		return enginePromise;
	}

	const webllm = await import("@mlc-ai/web-llm");
	loadedModelId = modelId;
	enginePromise = webllm
		.CreateMLCEngine(modelId, {
			initProgressCallback: (report) => {
				onProgress?.({ progress: report.progress, text: report.text });
			},
		})
		.catch((error) => {
			// Don't cache a rejected load — let the next attempt retry (e.g.
			// after the user frees up VRAM or switches model) instead of
			// failing every subsequent open of the drawer.
			enginePromise = null;
			loadedModelId = null;
			throw error;
		});
	return enginePromise;
}

/** Runs one JSON-schema-constrained chat completion — the shared low-level
 * call both task-extraction.ts's create and edit prompts sit on top of.
 * `schema` is a JSON Schema string; WebLLM grammar-constrains decoding to
 * only ever produce output matching it, which is what makes a 3B model
 * reliable enough for structured extraction (see chat_completion.d.ts's
 * `ResponseFormat.schema`). */
export async function runStructuredCompletion(
	engine: MLCEngine,
	systemPrompt: string,
	userPrompt: string,
	schema: string,
): Promise<string> {
	const reply = await engine.chat.completions.create({
		messages: [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userPrompt },
		],
		response_format: { type: "json_object", schema },
		temperature: 0.2,
	});
	const content = reply.choices[0]?.message?.content;
	if (!content) {
		throw new Error("Model returned an empty response.");
	}
	return content;
}
