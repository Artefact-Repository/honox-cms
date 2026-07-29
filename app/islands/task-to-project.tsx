import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useState } from "hono/jsx";
import { Anchor } from "../components/ui/anchor";
import { Avatar } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Clipboard } from "../components/ui/clipboard";
import { Dialog } from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import { Stack } from "../components/ui/stack";
import { Text } from "../components/ui/text";
import { Textarea } from "../components/ui/textarea";
import { TASK_PRIORITY_COLOR, type TaskPriority } from "../lib/tasks";

export interface TaskToProjectProps {
	slug: string;
	title: string;
	excerpt: string;
	priority: TaskPriority;
	assignee?: string;
	dueDate?: string;
	tags: string[];
	/** Controlled from outside — this dialog has no trigger of its own; the
	 * caller (e.g. the "..." actions dropdown) owns when it opens. */
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface Draft {
	title: string;
	summary: string;
	description: string;
}

type DraftStatus = "idle" | "loading" | "ready" | "error";

/** Pull the generated string out of a transformers.js text2text-generation result. */
function firstGeneratedText(output: unknown): string {
	const first = Array.isArray(output) ? output[0] : output;
	const text = (first as { generated_text?: unknown } | undefined)
		?.generated_text;
	return typeof text === "string" ? text.trim() : "";
}

/**
 * Cleans up a local-model answer: the prompts quote text back at the model,
 * and it sometimes copies the surrounding quote marks into its answer, echoes
 * a fragment of the instruction/field label instead of doing the task, or
 * (being instruction-tuned on GPT-generated data) produces a canned refusal
 * or meta-commentary about the task rather than performing it. Falls back to
 * the given fallback text when the output looks broken rather than shipping
 * garbage.
 */
function cleanGenerated(text: string, fallback: string): string {
	const cleaned = text.replace(/^["'\s]+|["'\s]+$/g, "");
	const looksBroken =
		cleaned.length < 2 ||
		/^(rewrite|title|summary|description|question|answer)\b\s*:?/i.test(
			cleaned,
		) ||
		/\bas an ai\b|\bai language model\b|^i'?m sorry\b/i.test(cleaned) ||
		cleaned.includes("Question:") ||
		cleaned.includes("Answer:");
	return looksBroken ? fallback : cleaned;
}

// Runs entirely in the browser (dynamic import keeps the ~small transformers.js
// runtime out of every page's initial bundle) — no server, no API key, model
// weights are fetched from the Hugging Face CDN once and cached by the browser.
// Cached across both the initial draft and the later "Enhance" pass so the
// model is only downloaded/initialized once per browser session.
let cachedGenerator: ReturnType<typeof loadGenerator> | null = null;
function loadGenerator() {
	return import("@huggingface/transformers").then(({ pipeline }) =>
		pipeline("text2text-generation", "Xenova/LaMini-Flan-T5-77M", {
			dtype: "q8",
		}),
	);
}
function getGenerator() {
	if (!cachedGenerator) cachedGenerator = loadGenerator();
	return cachedGenerator;
}

const generationOptions = {
	num_beams: 4,
	repetition_penalty: 1.5,
	no_repeat_ngram_size: 2,
};

async function draftWithLocalModel(props: TaskToProjectProps): Promise<Draft> {
	const generate = await getGenerator();

	// Calls are sequential, not Promise.all — transformers.js pipelines aren't
	// safe to invoke concurrently on the same instance (huggingface/transformers.js#1026);
	// parallel calls intermittently throw or corrupt output, especially on a
	// pipeline instance that's already been used once (see enhanceWithLocalModel).
	//
	// Plain instructions, not a "Question:/Answer:" scaffold — LaMini-Flan-T5 was
	// instruction-tuned on direct directives (see its model card), and the Q&A
	// framing is out-of-distribution for it: it was producing canned refusals
	// ("as an AI language model...") and meta-commentary about the field instead
	// of actually generating one.
	const titleOut = await generate(
		`Suggest a short, professional project name (3-6 words) for a project that includes this task.\nTask: "${props.title}"`,
		{ ...generationOptions, max_new_tokens: 12 },
	);
	const summaryOut = await generate(
		`Write one clear sentence describing the broader project that this task is part of.\nTask: "${props.title}"\nNotes: "${props.excerpt}"`,
		{ ...generationOptions, max_new_tokens: 30 },
	);
	const descriptionOut = await generate(
		`Write two or three sentences describing the broader project that this task is part of.\nTask: "${props.title}"\nNotes: "${props.excerpt}"`,
		{ ...generationOptions, max_new_tokens: 80 },
	);

	const generatedTitle = cleanGenerated(firstGeneratedText(titleOut), "");

	return {
		// The local model occasionally collapses to a near-empty or broken answer
		// on this prompt — falling back to the task's own title keeps the field
		// usable instead of shipping filler or a refusal.
		title:
			generatedTitle.split(/\s+/).length >= 3 ? generatedTitle : props.title,
		summary: cleanGenerated(firstGeneratedText(summaryOut), props.title),
		description: cleanGenerated(
			firstGeneratedText(descriptionOut),
			props.excerpt,
		),
	};
}

/**
 * Rewrites the current draft's title/summary/description for clarity and
 * polish, using the same local text2text-generation pipeline. Unlike
 * draftWithLocalModel (which invents content from a task), this only
 * rephrases what's already there, so each prompt quotes the existing field
 * back to the model instead of asking it to guess at project intent.
 */
async function enhanceWithLocalModel(draft: Draft): Promise<Draft> {
	const generate = await getGenerator();

	// Sequential for the same reason as draftWithLocalModel above. Plain
	// instructions rather than a "Question:/Answer:" scaffold, matching
	// draftWithLocalModel's prompts above — see the comment there for why.
	const titleOut = await generate(
		`Rewrite this project title so it is clear and professional, in 3-6 words. Do not add new information.\nTitle: "${draft.title}"`,
		{ ...generationOptions, max_new_tokens: 12 },
	);
	const summaryOut = await generate(
		`Rewrite this project summary as one clear, well-structured sentence, keeping the same meaning.\nSummary: "${draft.summary}"`,
		{ ...generationOptions, max_new_tokens: 30 },
	);
	const descriptionOut = await generate(
		`Rewrite this project description so it is clearer and better organized, in two or three sentences. Keep the same meaning.\nDescription: "${draft.description}"`,
		{ ...generationOptions, max_new_tokens: 80 },
	);

	const rewrittenTitle = cleanGenerated(
		firstGeneratedText(titleOut),
		draft.title,
	);
	const rewrittenSummary = cleanGenerated(
		firstGeneratedText(summaryOut),
		draft.summary,
	);
	const rewrittenDescription = cleanGenerated(
		firstGeneratedText(descriptionOut),
		draft.description,
	);

	return {
		// Same "collapses to near-empty answer" failure mode as the initial
		// draft — keep the user's current text rather than blanking a field.
		title:
			rewrittenTitle.split(/\s+/).length >= 3 ? rewrittenTitle : draft.title,
		summary: rewrittenSummary,
		description: rewrittenDescription,
	};
}

export default function TaskToProject(props: TaskToProjectProps) {
	const { open, onOpenChange } = props;
	const [status, setStatus] = useState<DraftStatus>("idle");
	const [draft, setDraft] = useState<Draft>({
		title: props.title,
		summary: "",
		description: props.excerpt,
	});
	const [error, setError] = useState<string | null>(null);
	const [enhancing, setEnhancing] = useState(false);
	const [enhanceError, setEnhanceError] = useState<string | null>(null);

	const colorPalette = TASK_PRIORITY_COLOR[props.priority];
	const startDate = new Date().toISOString().slice(0, 10);

	const runDraft = async () => {
		setStatus("loading");
		setError(null);
		try {
			const result = await draftWithLocalModel(props);
			setDraft(result);
			setStatus("ready");
		} catch (err) {
			console.error("Local project draft failed", err);
			setError(
				"The local model couldn't load — you can still fill this in by hand below.",
			);
			setStatus("error");
		}
	};

	const runEnhance = async () => {
		setEnhancing(true);
		setEnhanceError(null);
		try {
			const result = await enhanceWithLocalModel(draft);
			setDraft(result);
		} catch (err) {
			console.error("Local project enhance failed", err);
			setEnhanceError(
				"The local model couldn't enhance this — your text is unchanged.",
			);
		} finally {
			setEnhancing(false);
		}
	};

	const projectDraft = {
		title: draft.title,
		summary: draft.summary,
		description: draft.description,
		status: "Planning",
		colorPalette,
		owner: props.assignee ?? "",
		startDate,
		dueDate: props.dueDate ?? "",
		tags: props.tags,
	};
	const projectJson = JSON.stringify(projectDraft, null, "\t");

	return (
		<Dialog
			open={open}
			onOpenChange={(next: boolean) => {
				onOpenChange(next);
				if (next && status === "idle") void runDraft();
			}}
			title="Convert to Project"
			description="Drafted locally in your browser (LaMini-Flan-T5-77M, ONNX) — nothing is sent to a server. Review and edit, then create the entry in the CMS."
		>
			<Stack direction="column" gap="4" class={css({ alignItems: "stretch" })}>
				{status === "loading" && (
					<Text size="sm" class={css({ color: "fg.muted" })}>
						Downloading and running the local model — this only happens once per
						browser.
					</Text>
				)}
				{error && (
					<Text size="sm" class={css({ color: "fg.error" })}>
						{error}
					</Text>
				)}

				<Field
					label="Title"
					value={draft.title}
					onValueChange={(value: string) =>
						setDraft((d) => ({ ...d, title: value }))
					}
				/>
				<Field
					label="Summary"
					value={draft.summary}
					onValueChange={(value: string) =>
						setDraft((d) => ({ ...d, summary: value }))
					}
				/>
				<Textarea
					label="Description"
					rows={3}
					value={draft.description}
					onValueChange={(value: string) =>
						setDraft((d) => ({ ...d, description: value }))
					}
				/>

				<Stack gap="3" align="center" wrap="wrap">
					<button
						type="button"
						onClick={() => void runEnhance()}
						disabled={status === "loading" || enhancing}
						class={cx(button({ variant: "outline", size: "sm" }))}
					>
						{enhancing ? "Enhancing..." : "Enhance writing"}
					</button>
					<Text size="sm" class={css({ color: "fg.muted" })}>
						Rewrites the title, summary, and description above for clarity,
						using the same local model as the initial draft.
					</Text>
				</Stack>
				{enhanceError && (
					<Text size="sm" class={css({ color: "fg.error" })}>
						{enhanceError}
					</Text>
				)}

				<Stack gap="4" align="center" wrap="wrap">
					<Badge variant="subtle" colorPalette={colorPalette}>
						Planning
					</Badge>
					{props.assignee && (
						<Stack gap="2" align="center">
							<Avatar size="xs" name={props.assignee} />
							<Text size="sm" class={css({ color: "fg.muted" })}>
								{props.assignee}
							</Text>
						</Stack>
					)}
					{props.dueDate && (
						<Text size="sm" class={css({ color: "fg.muted" })}>
							Due {props.dueDate}
						</Text>
					)}
				</Stack>

				{props.tags.length > 0 && (
					<Stack gap="2" wrap="wrap">
						{props.tags.map((tag) => (
							<Badge key={tag} variant="subtle" colorPalette="gray" size="sm">
								{tag}
							</Badge>
						))}
					</Stack>
				)}

				<Stack gap="3" align="center" wrap="wrap">
					<Clipboard value={projectJson} label="Draft JSON" />
					<Anchor
						href="/admin/#/collections/projects/new"
						target="_blank"
						class={cx(button({ variant: "solid", size: "sm" }))}
					>
						Open in CMS
					</Anchor>
				</Stack>
			</Stack>
		</Dialog>
	);
}
