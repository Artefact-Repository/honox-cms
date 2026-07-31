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

/** The only two sizes actually usable on-device — kept intentionally tiny
 * (see /settings/local-llm) rather than exposing WebLLM's full prebuilt
 * model list, most of which are impractical to download/run in a browser
 * tab. */
export const AVAILABLE_MODELS = [
	{
		id: "Qwen2.5-3B-Instruct-q4f16_1-MLC",
		label: "Qwen2.5 3B Instruct (recommended)",
		description: "Best extraction quality — ~2GB download.",
	},
	{
		id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
		label: "Qwen2.5 1.5B Instruct (lighter)",
		description: "For lower-end devices — ~1GB download.",
	},
] as const;

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

const AI_ENABLED_STORAGE_KEY = "honox-ai-enabled";

/** Local inference is opt-in, default **off** — downloading a multi-GB model
 * and spinning up WebGPU isn't something to do without the user asking for
 * it first. Every AI entry point (the "Bulk Create (AI)" menu item, the
 * bulk-create drawer) must check this *in addition to* `isWebGpuSupported()`,
 * not instead of it — device capability and user consent are independent
 * gates. Configured at /settings/local-llm. */
export function isAiAssistEnabled(): boolean {
	if (typeof localStorage === "undefined") return false;
	return localStorage.getItem(AI_ENABLED_STORAGE_KEY) === "true";
}

export function setAiAssistEnabled(enabled: boolean): void {
	localStorage.setItem(AI_ENABLED_STORAGE_KEY, enabled ? "true" : "false");
}

/** Whether `modelId` is already downloaded into the browser's Cache Storage
 * — dynamic-imports WebLLM same as `getEngine`, so checking this doesn't pay
 * for the ~1MB+ library on pages that never open the AI drawer. */
export async function isModelCached(modelId: string): Promise<boolean> {
	if (!isWebGpuSupported()) return false;
	const webllm = await import("@mlc-ai/web-llm");
	return webllm.hasModelInCache(modelId);
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
