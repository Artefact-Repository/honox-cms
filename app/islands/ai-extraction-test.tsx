// THROWAWAY validation harness — not part of the shipped feature. Exists only
// to prove chunking + WebLLM schema-constrained extraction quality against a
// real document before building the actual review-UI/batch-commit drawer.
// Delete this file (and app/routes/tasks/ai-test.tsx) once validated.
import { useState } from "hono/jsx";
import {
	type EngineProgress,
	getEngine,
	getStoredModelId,
	isWebGpuSupported,
} from "../utils/ai-engine";
import {
	type ExtractionResult,
	extractTasksFromDocument,
} from "../utils/task-extraction";

const SAMPLE_DOC = `## Blog platform improvements

The blog needs real author bylines and accurate read times — right now every post falls back to the same placeholder values ("Artefact Team", "5 min read"), which makes the by-author archive page meaningless. Someone should go through all four English posts and their five translations and fill in real per-post metadata.

Marketing has also asked, more than once, for a newsletter signup capture block under each blog post. It should ship before end of quarter.

## PMS local AI assist

Before anyone builds UI, we need to prove that on-device LLM inference actually works in our production build — this has to happen first since the app has no backend server to fall back to if it doesn't. Diego is best placed to own this given his infra background.

Once that's proven out, build a shared inference provider utility that every AI-assisted feature calls into, so we aren't spinning up multiple model instances across the app.

## Documentation cleanup

Someone should double check that the PMS docs don't overstate what the app can currently do today — the docs have been drifting out of sync with the actual code for a while. Low priority, but worth doing sometime this quarter.`;

export interface AiExtractionTestProps {
	projects: { slug: string; title: string }[];
}

export default function AiExtractionTest(props: AiExtractionTestProps) {
	const [doc, setDoc] = useState(SAMPLE_DOC);
	const [instruction, setInstruction] = useState("");
	const [status, setStatus] = useState("");
	const [running, setRunning] = useState(false);
	const [result, setResult] = useState<ExtractionResult | null>(null);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const run = async () => {
		setRunning(true);
		setErrorMsg(null);
		setResult(null);
		try {
			setStatus("Loading model (first run downloads it, then it's cached)...");
			const engine = await getEngine(
				getStoredModelId(),
				(report: EngineProgress) => {
					setStatus(
						report.progress >= 0
							? `Loading model: ${Math.round(report.progress * 100)}% — ${report.text}`
							: report.text,
					);
				},
			);
			const extraction = await extractTasksFromDocument(
				engine,
				doc,
				instruction,
				props.projects,
				(chunkIndex, totalChunks) => {
					setStatus(`Extracting chunk ${chunkIndex + 1} of ${totalChunks}...`);
				},
			);
			setResult(extraction);
			setStatus(`Done — ${extraction.tasks.length} candidate task(s).`);
		} catch (err) {
			setErrorMsg(err instanceof Error ? err.message : String(err));
			setStatus("");
		} finally {
			setRunning(false);
		}
	};

	return (
		<div style="max-width: 900px; margin: 0 auto; padding: 24px; font-family: monospace;">
			<h1>AI extraction test harness</h1>
			<p>WebGPU supported: {isWebGpuSupported() ? "yes" : "NO"}</p>
			<p>Model: {getStoredModelId()}</p>

			<label>
				Document
				<br />
				<textarea
					rows={16}
					style="width: 100%; font-family: monospace;"
					value={doc}
					onInput={(e: Event) =>
						setDoc((e.target as HTMLTextAreaElement).value)
					}
				/>
			</label>

			<br />
			<br />

			<label>
				Instruction (optional)
				<br />
				<input
					type="text"
					style="width: 100%; font-family: monospace;"
					value={instruction}
					onInput={(e: Event) =>
						setInstruction((e.target as HTMLInputElement).value)
					}
				/>
			</label>

			<br />
			<br />

			<button type="button" disabled={running} onClick={() => void run()}>
				{running ? "Running..." : "Run extraction"}
			</button>

			<p>{status}</p>
			{errorMsg && <p style="color: red;">Error: {errorMsg}</p>}

			{result && (
				<>
					<h2>Candidate tasks ({result.tasks.length})</h2>
					<pre style="white-space: pre-wrap; background: #f0f0f0; padding: 12px;">
						{JSON.stringify(result.tasks, null, 2)}
					</pre>

					<h2>Per-chunk raw output ({result.chunks.length} chunks)</h2>
					{result.chunks.map((chunk) => (
						<details key={chunk.chunkIndex}>
							<summary>
								Chunk {chunk.chunkIndex + 1} — {chunk.tasks.length} task(s)
								{chunk.error ? ` — ERROR: ${chunk.error}` : ""}
							</summary>
							<pre style="white-space: pre-wrap; background: #f8f8f8; padding: 8px;">
								{chunk.rawResponse}
							</pre>
						</details>
					))}
				</>
			)}
		</div>
	);
}
