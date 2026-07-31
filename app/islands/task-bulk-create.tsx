import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";
import { Drawer } from "../components/ui/drawer";
import { Stack } from "../components/ui/stack";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import { TASK_PRIORITIES, TASK_STATUSES } from "../lib/tasks";
import {
	type EngineProgress,
	getEngine,
	getStoredModelId,
	isWebGpuSupported,
} from "../utils/ai-engine";
import {
	type CandidateTask,
	extractTasksFromDocument,
} from "../utils/task-extraction";
import { createTasksBulk } from "../utils/task-save";
import FileUploadIsland from "./file-upload";

export interface TaskBulkCreateProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	projects: { label: string; value: string }[];
}

export default function TaskBulkCreate(props: TaskBulkCreateProps) {
	const [docText, setDocText] = useState("");
	const [instruction, setInstruction] = useState("");
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState("");
	const [candidates, setCandidates] = useState<
		(CandidateTask & { id: string; selected: boolean; expanded: boolean })[]
	>([]);
	const [committing, setCommitting] = useState(false);

	const resetState = () => {
		setDocText("");
		setInstruction("");
		setLoading(false);
		setStatus("");
		setCandidates([]);
		setCommitting(false);
	};

	useEffect(() => {
		if (!props.open) {
			resetState();
		}
	}, [props.open]);

	const handleFileAccept = (details: { files: File[] }) => {
		const file = details.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result;
			if (typeof text === "string") {
				setDocText(text);
				toaster.success(`Loaded file: ${file.name}`);
			}
		};
		reader.onerror = () => {
			toaster.error(`Failed to read file: ${file.name}`);
		};
		reader.readAsText(file);
	};

	const runExtraction = async () => {
		if (!docText.trim()) {
			toaster.error("Please enter some text or upload a document first.");
			return;
		}
		setLoading(true);
		setStatus("Starting local LLM engine...");
		setCandidates([]);

		try {
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

			const projectMap = props.projects.map((p) => ({
				slug: p.value,
				title: p.label,
			}));

			setStatus("Running extraction...");
			const result = await extractTasksFromDocument(
				engine,
				docText,
				instruction,
				projectMap,
				(chunkIndex, totalChunks) => {
					setStatus(`Extracting chunk ${chunkIndex + 1} of ${totalChunks}...`);
				},
			);

			// Cap batch size to 30 candidate tasks
			const rawTasks = result.tasks.slice(0, 30);

			if (rawTasks.length === 0) {
				toaster.info(
					"No actionable tasks could be extracted from this document.",
				);
				setStatus("Extraction completed — 0 tasks found.");
			} else {
				const wrapped = rawTasks.map((task, idx) => ({
					...task,
					id: `${Date.now()}-${idx}`,
					selected: true,
					expanded: idx === 0, // expand first task by default
				}));
				setCandidates(wrapped);
				toaster.success(`Successfully extracted ${rawTasks.length} tasks!`);
				setStatus(
					`Ready — extracted ${rawTasks.length} candidate tasks (capped at 30).`,
				);
			}
		} catch (err) {
			console.error(err);
			const msg = err instanceof Error ? err.message : String(err);
			toaster.error(`Extraction failed: ${msg}`);
			setStatus(`Error: ${msg}`);
		} finally {
			setLoading(false);
		}
	};

	const handleCommit = async () => {
		const selected = candidates.filter((c) => c.selected);
		if (selected.length === 0) {
			toaster.error("Please select at least one task to commit.");
			return;
		}

		setCommitting(true);
		try {
			// Map to NewTaskInput
			const taskInputs = selected.map((c) => ({
				title: c.title.trim(),
				project: c.project,
				status: c.status,
				priority: c.priority,
				assignee: c.assignee?.trim() || undefined,
				dueDate: c.dueDate || undefined,
				tags: c.tags,
				body: c.body || undefined,
			}));

			await createTasksBulk(
				taskInputs,
				`AI batch: Bulk created ${selected.length} tasks`,
			);
			toaster.success(
				`Successfully committed ${selected.length} tasks to main branch!`,
				{
					description: "Live on site once the rebuild completes.",
				},
			);
			props.onOpenChange(false);
			resetState();
		} catch (err) {
			console.error(err);
			const msg = err instanceof Error ? err.message : String(err);
			toaster.error(`Commit failed: ${msg}`);
		} finally {
			setCommitting(false);
		}
	};

	const toggleSelectAll = (selected: boolean) => {
		setCandidates((prev) => prev.map((c) => ({ ...c, selected })));
	};

	const updateCandidateField = (
		id: string,
		field: keyof CandidateTask,
		value: any,
	) => {
		setCandidates((prev) =>
			prev.map((c) => {
				if (c.id !== id) return c;
				return { ...c, [field]: value };
			}),
		);
	};

	const removeCandidate = (id: string) => {
		setCandidates((prev) => prev.filter((c) => c.id !== id));
		toaster.info("Candidate task removed from batch.");
	};

	const selectedCount = candidates.filter((c) => c.selected).length;

	const bodyContent = (
		<Stack
			direction="column"
			gap="5"
			class={css({ alignItems: "stretch", width: "full" })}
		>
			{/* WebGPU Support Warning */}
			{!isWebGpuSupported() && (
				<div
					class={css({
						p: "3",
						bg: "red.50",
						border: "1px solid",
						borderColor: "red.200",
						borderRadius: "md",
						color: "red.700",
						fontSize: "sm",
					})}
				>
					<strong>WebGPU is not supported by this browser.</strong> Please try a
					modern browser (Chrome, Edge, or Opera) with a WebGPU compatible
					device.
				</div>
			)}

			{/* Source Input Area */}
			<div
				class={css({
					border: "1px solid",
					borderColor: "border",
					p: "4",
					borderRadius: "md",
					bg: "bg.muted",
				})}
			>
				<Text size="sm" class={css({ fontWeight: "semibold", mb: "2" })}>
					1. Provide Roadmap / Document Source
				</Text>
				<div class={css({ mb: "3" })}>
					<FileUploadIsland
						accept=".txt,.md"
						onFileAccept={handleFileAccept}
						label="Upload txt/md file (FileReader only, 100% private)"
					/>
				</div>
				<div>
					<Text size="xs" class={css({ mb: "1", color: "fg.muted" })}>
						Or paste document content below:
					</Text>
					<textarea
						rows={8}
						placeholder="Paste roadmap, meeting notes, spec document..."
						value={docText}
						onInput={(e: Event) =>
							setDocText((e.target as HTMLTextAreaElement).value)
						}
						class={css({
							width: "full",
							borderWidth: "1px",
							borderColor: "border",
							borderRadius: "sm",
							p: "2.5",
							fontSize: "sm",
							bg: "bg",
							color: "fg",
							fontFamily: "monospace",
						})}
					/>
				</div>
			</div>

			{/* Extra instruction input */}
			<div>
				<Text size="sm" class={css({ fontWeight: "semibold", mb: "1.5" })}>
					2. Guidance Prompt / Custom Instructions (Optional)
				</Text>
				<input
					type="text"
					placeholder="e.g. 'Focus on backend engineering tasks' or 'Only extract high priority tasks'"
					value={instruction}
					onInput={(e: Event) =>
						setInstruction((e.target as HTMLInputElement).value)
					}
					class={css({
						width: "full",
						borderWidth: "1px",
						borderColor: "border",
						borderRadius: "sm",
						px: "2.5",
						py: "1.5",
						fontSize: "sm",
						bg: "bg",
						color: "fg",
					})}
				/>
			</div>

			{/* Trigger Button */}
			<div>
				<button
					type="button"
					onClick={() => void runExtraction()}
					disabled={loading || !isWebGpuSupported() || !docText.trim()}
					class={cx(
						button({ variant: "solid", size: "md" }),
						css({ width: "full" }),
					)}
				>
					{loading ? "Extracting with Local AI..." : "Extract Tasks (AI)"}
				</button>
				{status && (
					<Text
						size="xs"
						class={css({
							mt: "2",
							color: "fg.info",
							fontStyle: "italic",
							textAlign: "center",
							display: "block",
						})}
					>
						{status}
					</Text>
				)}
			</div>

			{/* Extraction Output Grid / Review Panel */}
			{candidates.length > 0 && (
				<div
					class={css({
						borderTop: "2px solid",
						borderColor: "border",
						pt: "4",
					})}
				>
					<div
						class={css({
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: "3",
						})}
					>
						<Text size="md" class={css({ fontWeight: "bold" })}>
							3. Review & Edit Extracted Tasks
						</Text>
						<span
							class={css({
								fontSize: "sm",
								color: "fg.muted",
								fontWeight: "medium",
							})}
						>
							Selected: {selectedCount} of {candidates.length} tasks
						</span>
					</div>

					<div class={css({ display: "flex", gap: "2", mb: "3" })}>
						<button
							type="button"
							onClick={() => toggleSelectAll(true)}
							class={cx(button({ variant: "outline", size: "xs" }))}
						>
							Select All
						</button>
						<button
							type="button"
							onClick={() => toggleSelectAll(false)}
							class={cx(button({ variant: "outline", size: "xs" }))}
						>
							Deselect All
						</button>
					</div>

					{/* Editable list of candidate tasks */}
					<Stack
						direction="column"
						gap="4"
						class={css({ alignItems: "stretch", width: "full" })}
					>
						{candidates.map((cand) => (
							<div
								key={cand.id}
								class={css({
									border: "1px solid",
									borderColor: cand.selected ? "border" : "border.muted",
									borderRadius: "md",
									p: "3.5",
									bg: cand.selected ? "bg.subtle" : "bg.muted",
									opacity: cand.selected ? 1 : 0.6,
								})}
							>
								{/* Header of Row */}
								<div
									class={css({
										display: "flex",
										alignItems: "center",
										gap: "3",
										mb: cand.expanded ? "4" : "0",
									})}
								>
									<input
										type="checkbox"
										checked={cand.selected}
										onChange={(e: Event) =>
											updateCandidateField(
												cand.id,
												"selected",
												(e.target as HTMLInputElement).checked,
											)
										}
										class={css({ width: "4", height: "4", cursor: "pointer" })}
									/>
									<span
										class={css({
											fontWeight: "bold",
											fontSize: "sm",
											flex: "1",
											whiteSpace: "nowrap",
											overflow: "hidden",
											textOverflow: "ellipsis",
										})}
									>
										{cand.title || "(Untitled Task)"}
									</span>
									<span
										class={css({
											fontSize: "xs",
											px: "2",
											py: "0.5",
											borderRadius: "full",
											bg: "bg",
											border: "1px solid",
											borderColor: "border",
										})}
									>
										{cand.project || "No project"}
									</span>
									<button
										type="button"
										onClick={() =>
											setCandidates((prev) =>
												prev.map((c) =>
													c.id === cand.id
														? { ...c, expanded: !c.expanded }
														: c,
												),
											)
										}
										class={cx(button({ variant: "ghost", size: "xs" }))}
									>
										{cand.expanded ? "Hide Details" : "Edit Details"}
									</button>
									<button
										type="button"
										onClick={() => removeCandidate(cand.id)}
										class={cx(
											button({ variant: "outline", size: "xs" }),
											css({ color: "red.600", borderColor: "red.200" }),
										)}
									>
										Delete
									</button>
								</div>

								{/* Expanded detail form */}
								{cand.expanded && (
									<Stack
										direction="column"
										gap="3"
										class={css({
											alignItems: "stretch",
											width: "full",
											pt: "2",
											borderTop: "1px dashed",
											borderColor: "border",
										})}
									>
										<div>
											<Text
												size="xs"
												class={css({ fontWeight: "semibold", mb: "1" })}
											>
												Title
											</Text>
											<input
												type="text"
												value={cand.title}
												onInput={(e: Event) =>
													updateCandidateField(
														cand.id,
														"title",
														(e.target as HTMLInputElement).value,
													)
												}
												class={css({
													width: "full",
													borderWidth: "1px",
													borderColor: "border",
													borderRadius: "sm",
													p: "1.5",
													fontSize: "sm",
													bg: "bg",
													color: "fg",
												})}
											/>
										</div>

										<div class={css({ display: "flex", gap: "3" })}>
											<div class={css({ flex: "1" })}>
												<Text
													size="xs"
													class={css({ fontWeight: "semibold", mb: "1" })}
												>
													Project
												</Text>
												<select
													value={cand.project}
													onChange={(e: Event) =>
														updateCandidateField(
															cand.id,
															"project",
															(e.target as HTMLSelectElement).value,
														)
													}
													class={css({
														width: "full",
														borderWidth: "1px",
														borderColor: "border",
														borderRadius: "sm",
														p: "1.5",
														fontSize: "sm",
														bg: "bg",
														color: "fg",
													})}
												>
													<option value="">Select project...</option>
													{props.projects.map((p) => (
														<option key={p.value} value={p.value}>
															{p.label}
														</option>
													))}
												</select>
											</div>

											<div class={css({ flex: "1" })}>
												<Text
													size="xs"
													class={css({ fontWeight: "semibold", mb: "1" })}
												>
													Status
												</Text>
												<select
													value={cand.status}
													onChange={(e: Event) =>
														updateCandidateField(
															cand.id,
															"status",
															(e.target as HTMLSelectElement).value,
														)
													}
													class={css({
														width: "full",
														borderWidth: "1px",
														borderColor: "border",
														borderRadius: "sm",
														p: "1.5",
														fontSize: "sm",
														bg: "bg",
														color: "fg",
													})}
												>
													{TASK_STATUSES.map((status) => (
														<option key={status} value={status}>
															{status}
														</option>
													))}
												</select>
											</div>

											<div class={css({ flex: "1" })}>
												<Text
													size="xs"
													class={css({ fontWeight: "semibold", mb: "1" })}
												>
													Priority
												</Text>
												<select
													value={cand.priority}
													onChange={(e: Event) =>
														updateCandidateField(
															cand.id,
															"priority",
															(e.target as HTMLSelectElement).value,
														)
													}
													class={css({
														width: "full",
														borderWidth: "1px",
														borderColor: "border",
														borderRadius: "sm",
														p: "1.5",
														fontSize: "sm",
														bg: "bg",
														color: "fg",
													})}
												>
													{TASK_PRIORITIES.map((priority) => (
														<option key={priority} value={priority}>
															{priority}
														</option>
													))}
												</select>
											</div>
										</div>

										<div class={css({ display: "flex", gap: "3" })}>
											<div class={css({ flex: "1" })}>
												<Text
													size="xs"
													class={css({ fontWeight: "semibold", mb: "1" })}
												>
													Assignee
												</Text>
												<input
													type="text"
													value={cand.assignee || ""}
													onInput={(e: Event) =>
														updateCandidateField(
															cand.id,
															"assignee",
															(e.target as HTMLInputElement).value,
														)
													}
													class={css({
														width: "full",
														borderWidth: "1px",
														borderColor: "border",
														borderRadius: "sm",
														p: "1.5",
														fontSize: "sm",
														bg: "bg",
														color: "fg",
													})}
												/>
											</div>

											<div class={css({ flex: "1" })}>
												<Text
													size="xs"
													class={css({ fontWeight: "semibold", mb: "1" })}
												>
													Due Date
												</Text>
												<input
													type="date"
													value={cand.dueDate || ""}
													onInput={(e: Event) =>
														updateCandidateField(
															cand.id,
															"dueDate",
															(e.target as HTMLInputElement).value,
														)
													}
													class={css({
														width: "full",
														borderWidth: "1px",
														borderColor: "border",
														borderRadius: "sm",
														p: "1.5",
														fontSize: "sm",
														bg: "bg",
														color: "fg",
													})}
												/>
											</div>
										</div>

										<div>
											<Text
												size="xs"
												class={css({ fontWeight: "semibold", mb: "1" })}
											>
												Tags (comma-separated)
											</Text>
											<input
												type="text"
												value={cand.tags.join(", ")}
												onInput={(e: Event) => {
													const val = (e.target as HTMLInputElement).value;
													const tags = val
														.split(",")
														.map((t) => t.trim())
														.filter(Boolean);
													updateCandidateField(cand.id, "tags", tags);
												}}
												class={css({
													width: "full",
													borderWidth: "1px",
													borderColor: "border",
													borderRadius: "sm",
													p: "1.5",
													fontSize: "sm",
													bg: "bg",
													color: "fg",
												})}
											/>
										</div>

										<div>
											<Text
												size="xs"
												class={css({ fontWeight: "semibold", mb: "1" })}
											>
												Description / Body
											</Text>
											<textarea
												rows={3}
												value={cand.body || ""}
												onInput={(e: Event) =>
													updateCandidateField(
														cand.id,
														"body",
														(e.target as HTMLTextAreaElement).value,
													)
												}
												class={css({
													width: "full",
													borderWidth: "1px",
													borderColor: "border",
													borderRadius: "sm",
													p: "1.5",
													fontSize: "sm",
													bg: "bg",
													color: "fg",
												})}
											/>
										</div>
									</Stack>
								)}
							</div>
						))}
					</Stack>
				</div>
			)}
		</Stack>
	);

	return (
		<Drawer
			open={props.open}
			onOpenChange={props.onOpenChange}
			closeOnEscape={false}
			closeOnInteractOutside={false}
			size="lg"
			title="Bulk Create Tasks (Local AI)"
			description="Extract actionable engineering tasks from raw roadmap docs or specs using on-device, fully-private LLM inference."
			body={bodyContent}
			footer={
				<Stack gap="3" justify="end" class={css({ width: "full" })}>
					<button
						type="button"
						onClick={() => props.onOpenChange(false)}
						class={cx(button({ variant: "outline", size: "sm" }))}
					>
						Cancel
					</button>
					{candidates.length > 0 && (
						<button
							type="button"
							onClick={() => void handleCommit()}
							disabled={selectedCount === 0 || committing}
							class={cx(button({ variant: "solid", size: "sm" }))}
						>
							{committing ? "Saving batch..." : `Create ${selectedCount} Tasks`}
						</button>
					)}
				</Stack>
			}
		/>
	);
}
