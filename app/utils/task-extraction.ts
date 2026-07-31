// Turns a free-text document (an implementation roadmap, a spec, a meeting
// note) into a list of candidate tasks matching the same shape task-save.ts's
// `createTask` writes, via a local WebLLM model (ai-engine.ts). Nothing here
// writes anything — this only produces candidates for a review UI to approve
// or edit before any git commit happens.
import type { MLCEngine } from "@mlc-ai/web-llm";
import {
	TASK_PRIORITIES,
	TASK_STATUSES,
	type TaskPriority,
	type TaskStatus,
} from "../lib/tasks";
import { runStructuredCompletion } from "./ai-engine";

export interface CandidateTask {
	title: string;
	project: string;
	status: TaskStatus;
	priority: TaskPriority;
	assignee?: string;
	dueDate?: string;
	tags: string[];
	body: string;
}

export interface ExtractionChunkResult {
	chunkIndex: number;
	rawResponse: string;
	tasks: CandidateTask[];
	error?: string;
}

export interface ExtractionResult {
	tasks: CandidateTask[];
	chunks: ExtractionChunkResult[];
}

// Conservative char budget per chunk — WebLLM's prebuilt 3B models are
// generally configured with a context window in the low thousands of
// tokens, and each prompt also carries the system instructions, the running
// "already extracted" title list, and generation headroom. ~3000 chars
// (~700-900 tokens of English/markdown) leaves enough room for the rest.
const CHUNK_CHAR_BUDGET = 3000;

/** Splits on markdown headings first (keeps semantically related content
 * together), then further splits any still-oversized section by paragraph
 * groups. Documents with no headings just fall through to paragraph
 * chunking directly. */
export function chunkDocument(doc: string): string[] {
	const headingSections = doc
		.split(/\n(?=#{1,6}\s)/)
		.map((section) => section.trim())
		.filter(Boolean);
	const sections = headingSections.length > 0 ? headingSections : [doc.trim()];

	const chunks: string[] = [];
	for (const section of sections) {
		if (section.length <= CHUNK_CHAR_BUDGET) {
			chunks.push(section);
			continue;
		}
		const paragraphs = section.split(/\n{2,}/);
		let current = "";
		for (const paragraph of paragraphs) {
			const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
			if (candidate.length > CHUNK_CHAR_BUDGET && current) {
				chunks.push(current);
				current = paragraph;
			} else {
				current = candidate;
			}
		}
		if (current) chunks.push(current);
	}
	return chunks;
}

function buildSchema(projectSlugs: string[]): string {
	return JSON.stringify({
		type: "object",
		properties: {
			tasks: {
				type: "array",
				maxItems: 10,
				items: {
					type: "object",
					properties: {
						title: { type: "string" },
						project: { type: "string", enum: projectSlugs },
						status: { type: "string", enum: TASK_STATUSES },
						priority: { type: "string", enum: TASK_PRIORITIES },
						assignee: { type: "string" },
						dueDate: { type: "string" },
						tags: { type: "array", items: { type: "string" } },
						body: { type: "string" },
					},
					required: ["title", "project", "status", "priority", "tags", "body"],
				},
			},
		},
		required: ["tasks"],
	});
}

function buildSystemPrompt(
	instruction: string,
	projects: { slug: string; title: string }[],
	alreadyExtractedTitles: string,
): string {
	const projectList = projects
		.map((project) => `- ${project.slug}: ${project.title}`)
		.join("\n");
	return `You extract actionable engineering tasks from a document and output them as JSON matching the given schema.

Rules:
- Only extract concrete, actionable work items — not headings, summaries, or background info.
- "project" must be exactly one of these existing project slugs (pick the closest match; never invent a new one):
${projectList}
- "status" defaults to "To Do" unless the document says work is already in progress or done.
- "priority" defaults to "Medium" unless the document signals otherwise.
- "body" is a short markdown description giving enough context to act on the task, grounded only in this document's content.
- "tags" is a short list of relevant keywords (can be empty).
- Skip anything already covered by these already-extracted titles: ${alreadyExtractedTitles}
- Follow this additional instruction from the user: ${instruction || "(none)"}

Output only the JSON object — no commentary.`;
}

function normalizeTitle(title: string): string {
	return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseChunkResponse(raw: string): CandidateTask[] {
	const parsed = JSON.parse(raw) as { tasks?: unknown };
	if (!Array.isArray(parsed.tasks)) return [];
	return parsed.tasks
		.filter(
			(task): task is CandidateTask =>
				!!task &&
				typeof task === "object" &&
				typeof (task as CandidateTask).title === "string" &&
				(task as CandidateTask).title.trim().length > 0,
		)
		.map((task) => ({
			title: task.title.trim(),
			project: task.project,
			status: task.status,
			priority: task.priority,
			assignee: task.assignee?.trim() || undefined,
			dueDate: task.dueDate?.trim() || undefined,
			tags: Array.isArray(task.tags) ? task.tags : [],
			body: task.body ?? "",
		}));
}

/** Runs extraction chunk-by-chunk, carrying forward already-extracted titles
 * in each subsequent prompt to suppress obvious cross-chunk duplicates, then
 * does a final client-side dedupe pass on normalized titles. On a
 * schema-invalid response, retries that one chunk once with the parse error
 * appended before giving up on it (surfaced via `error` on that chunk's
 * result, not thrown — a single bad chunk shouldn't sink the whole batch). */
export async function extractTasksFromDocument(
	engine: MLCEngine,
	document: string,
	instruction: string,
	projects: { slug: string; title: string }[],
	onChunkStart?: (chunkIndex: number, totalChunks: number) => void,
): Promise<ExtractionResult> {
	const projectSlugs = projects.map((project) => project.slug);
	const schema = buildSchema(projectSlugs);
	const chunks = chunkDocument(document);
	const seenTitles = new Set<string>();
	const chunkResults: ExtractionChunkResult[] = [];
	const allTasks: CandidateTask[] = [];

	for (let i = 0; i < chunks.length; i++) {
		onChunkStart?.(i, chunks.length);
		const alreadyExtracted =
			seenTitles.size > 0 ? Array.from(seenTitles).join("; ") : "(none yet)";
		const systemPrompt = buildSystemPrompt(
			instruction,
			projects,
			alreadyExtracted,
		);

		let rawResponse = "";
		let tasks: CandidateTask[] = [];
		let error: string | undefined;
		for (let attempt = 0; attempt < 2; attempt++) {
			try {
				rawResponse = await runStructuredCompletion(
					engine,
					systemPrompt,
					attempt === 0
						? chunks[i]!
						: `${chunks[i]}\n\n(Your previous response failed to parse as valid JSON: ${error}. Try again.)`,
					schema,
				);
				tasks = parseChunkResponse(rawResponse);
				error = undefined;
				break;
			} catch (err) {
				error = err instanceof Error ? err.message : String(err);
			}
		}

		for (const task of tasks) {
			const key = normalizeTitle(task.title);
			if (seenTitles.has(key)) continue;
			seenTitles.add(key);
			allTasks.push(task);
		}
		chunkResults.push({ chunkIndex: i, rawResponse, tasks, error });
	}

	return { tasks: allTasks, chunks: chunkResults };
}
