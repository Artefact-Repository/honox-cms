import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";
import { Anchor } from "../components/ui/anchor";
import { InteractiveCombobox } from "../components/ui/combobox-primitive";
import { Drawer } from "../components/ui/drawer";
import { Field } from "../components/ui/field";
import { Stack } from "../components/ui/stack";
import { TagsField } from "../components/ui/tags-field";
import { Text } from "../components/ui/text";
import { Textarea } from "../components/ui/textarea";
import { toaster } from "../components/ui/toast";
import { TASK_PRIORITIES, TASK_STATUSES, type Task } from "../lib/tasks";
import { createTask, TaskSaveError, updateTask } from "../utils/task-save";

const statusItems = TASK_STATUSES.map((status) => ({
	label: status,
	value: status,
}));
const priorityItems = TASK_PRIORITIES.map((priority) => ({
	label: priority,
	value: priority,
}));

export interface TaskCreateDrawerProps {
	projects: { label: string; value: string }[];
	/** Pre-selects a project — e.g. when opened from that project's page. */
	defaultProjectSlug?: string;
	/** Candidate parent tasks, for the optional "make this a subtask" field. */
	tasks?: { label: string; value: string }[];
	/** Pre-selects a parent task — e.g. "+ Add subtask" from a task's page. */
	defaultParentTaskSlug?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Edits this task in place instead of creating a new one — the tasks
	 * table's row-level Edit action (see task-edit-action.tsx) reuses this
	 * same drawer, just prefilled with the task's current fields. `body` is
	 * fetched separately by the caller since the table's row data only
	 * carries a truncated `excerpt`, not the raw markdown body. */
	editTask?: { task: Task; body: string };
}

const emptyForm = (
	defaultProjectSlug?: string,
	defaultParentTaskSlug?: string,
) => ({
	title: "",
	project: defaultProjectSlug ?? "",
	parentTask: defaultParentTaskSlug ?? "",
	status: TASK_STATUSES[0],
	priority: "Medium",
	assignee: "",
	dueDate: "",
	tags: [] as string[],
	body: "",
});

const formFromTask = (task: Task, body: string) => ({
	title: task.title,
	project: task.project,
	parentTask: task.parentTask ?? "",
	status: task.status,
	priority: task.priority,
	assignee: task.assignee ?? "",
	dueDate: task.dueDate ?? "",
	tags: task.tags,
	body,
});

// Same "no live backend" constraint as every other task editor (see
// TaskEditableText) — this commits straight to the git host via
// createTask/task-save.ts (Sveltia's session token, or our manually-connected
// one) when one is available, and otherwise falls back to a link into the
// CMS's own "new entry" screen rather than pretending to have saved anything.
export default function TaskCreateDrawer(props: TaskCreateDrawerProps) {
	const [form, setForm] = useState(() =>
		props.editTask
			? formFromTask(props.editTask.task, props.editTask.body)
			: emptyForm(props.defaultProjectSlug, props.defaultParentTaskSlug),
	);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Rebuild the form fresh each time the drawer opens — same subject
	// (create vs. this particular task) can otherwise show stale state from
	// a previous open, e.g. if `editTask` changed while the drawer was closed.
	useEffect(() => {
		if (!props.open) return;
		setForm(
			props.editTask
				? formFromTask(props.editTask.task, props.editTask.body)
				: emptyForm(props.defaultProjectSlug, props.defaultParentTaskSlug),
		);
		setError(null);
	}, [props.open]);

	const resetAndClose = () => {
		setError(null);
		props.onOpenChange(false);
	};

	const handleSave = async () => {
		if (!form.title.trim() || !form.project) return;
		setSaving(true);
		setError(null);
		const input = {
			title: form.title.trim(),
			project: form.project,
			parentTask: form.parentTask || undefined,
			status: form.status,
			priority: form.priority,
			assignee: form.assignee.trim() || undefined,
			dueDate: form.dueDate || undefined,
			tags: form.tags,
			body: form.body.trim() || undefined,
		};
		try {
			if (props.editTask) {
				await updateTask(props.editTask.task.slug, input);
				toaster.success(`Updated "${input.title}".`, {
					description: "Committed to main — live once the site rebuilds.",
				});
			} else {
				const slug = await createTask(input);
				toaster.success(`Created "${input.title}".`, {
					description: "Committed to main — live once the site rebuilds.",
				});
				void slug;
			}
			resetAndClose();
		} catch (err) {
			const message =
				err instanceof TaskSaveError || err instanceof Error
					? err.message
					: props.editTask
						? "Failed to save the task."
						: "Failed to create the task.";
			// Toasted (not just shown inline) so a failure is never missed even
			// if the drawer's form is tall enough to scroll the inline banner
			// below the fold — see the "it doesn't save" 404 report this was
			// added for (an unrelated GitHub Contents API permission error that
			// was only ever surfacing as easy-to-miss inline text).
			toaster.error(message);
			setError(message);
		} finally {
			setSaving(false);
		}
	};

	const canSave = form.title.trim().length > 0 && form.project.length > 0;

	return (
		<Drawer
			open={props.open}
			onOpenChange={(next: boolean) => {
				if (!next) {
					resetAndClose();
					return;
				}
				props.onOpenChange(true);
			}}
			closeOnEscape={false}
			closeOnInteractOutside={false}
			size="lg"
			title={props.editTask ? "Edit Task" : "New Task"}
			description={
				props.editTask
					? "Edits this task file and commits the change to main — same as the CMS."
					: "Creates a task file and commits it to main — same as the CMS."
			}
			footer={
				<Stack gap="3" justify="end" class={css({ width: "full" })}>
					<button
						type="button"
						onClick={resetAndClose}
						class={cx(button({ variant: "outline", size: "sm" }))}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => void handleSave()}
						disabled={!canSave || saving}
						class={cx(button({ variant: "solid", size: "sm" }))}
					>
						{props.editTask
							? saving
								? "Saving..."
								: "Save changes"
							: saving
								? "Creating..."
								: "Create task"}
					</button>
				</Stack>
			}
			// Passed as `body` (not `children`) so this lands inside the
			// Drawer's own `<Body>` part — the slot with `flex: 1`,
			// `overflow: auto`, and the bottom padding that keeps content clear
			// of the absolutely-positioned footer (see drawer.ts). Raw
			// `children` renders as a sibling of Header/Body/Footer with none
			// of that, so a form this long would never scroll.
			body={
				<Stack
					direction="column"
					gap="4"
					class={css({ alignItems: "stretch", width: "full" })}
				>
					<Field
						label="Title"
						value={form.title}
						onValueChange={(value: string) =>
							setForm((f) => ({ ...f, title: value }))
						}
						required
					/>

					<div>
						<Text size="sm" class={css({ fontWeight: "medium", mb: "1.5" })}>
							Project
						</Text>
						<InteractiveCombobox
							items={props.projects}
							value={form.project}
							onValueChange={(value: string) =>
								setForm((f) => ({ ...f, project: value }))
							}
							placeholder="Search projects..."
							allowClear
							size="sm"
						/>
					</div>

					{props.tasks && props.tasks.length > 0 && (
						<div>
							<Text size="sm" class={css({ fontWeight: "medium", mb: "1.5" })}>
								Parent task
							</Text>
							<InteractiveCombobox
								items={props.tasks}
								value={form.parentTask}
								onValueChange={(value: string) =>
									setForm((f) => ({ ...f, parentTask: value }))
								}
								placeholder="None — top-level task"
								allowClear
								size="sm"
							/>
						</div>
					)}

					<Stack gap="4" wrap="wrap" class={css({ alignItems: "stretch" })}>
						<div class={css({ flex: "1", minWidth: "36" })}>
							<Text size="sm" class={css({ fontWeight: "medium", mb: "1.5" })}>
								Status
							</Text>
							<InteractiveCombobox
								items={statusItems}
								value={form.status}
								onValueChange={(value: string) =>
									setForm((f) => ({ ...f, status: value }))
								}
								size="sm"
							/>
						</div>
						<div class={css({ flex: "1", minWidth: "36" })}>
							<Text size="sm" class={css({ fontWeight: "medium", mb: "1.5" })}>
								Priority
							</Text>
							<InteractiveCombobox
								items={priorityItems}
								value={form.priority}
								onValueChange={(value: string) =>
									setForm((f) => ({ ...f, priority: value }))
								}
								size="sm"
							/>
						</div>
					</Stack>

					<Stack gap="4" wrap="wrap" class={css({ alignItems: "stretch" })}>
						<div class={css({ flex: "1", minWidth: "36" })}>
							<Field
								label="Assignee"
								value={form.assignee}
								onValueChange={(value: string) =>
									setForm((f) => ({ ...f, assignee: value }))
								}
							/>
						</div>
						<div class={css({ flex: "1", minWidth: "36" })}>
							<Text size="sm" class={css({ fontWeight: "medium", mb: "1.5" })}>
								Due date
							</Text>
							<input
								type="date"
								value={form.dueDate}
								onInput={(e: Event) =>
									setForm((f) => ({
										...f,
										dueDate: (e.target as HTMLInputElement).value,
									}))
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
					</Stack>

					<TagsField
						label="Tags"
						helperText="Press Enter to add a tag"
						value={form.tags}
						onValueChange={(details: { value: string[] }) =>
							setForm((f) => ({ ...f, tags: details.value }))
						}
					/>

					<Textarea
						label="Description"
						rows={4}
						value={form.body}
						onValueChange={(value: string) =>
							setForm((f) => ({ ...f, body: value }))
						}
					/>

					{error && (
						<Text size="sm" class={css({ color: "fg.error" })}>
							{error}{" "}
							<Anchor
								href={
									props.editTask
										? `/admin/#/collections/tasks/entries/${props.editTask.task.slug}`
										: "/admin/#/collections/tasks/entries/new"
								}
								target="_blank"
								variant="plain"
							>
								{props.editTask ? "Edit it" : "Create it"} in the CMS
							</Anchor>{" "}
							instead.
						</Text>
					)}
				</Stack>
			}
		/>
	);
}
