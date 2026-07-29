import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useState } from "hono/jsx";
import { Anchor } from "../components/ui/anchor";
import { InteractiveCombobox } from "../components/ui/combobox-primitive";
import { Drawer } from "../components/ui/drawer";
import { Field } from "../components/ui/field";
import { Stack } from "../components/ui/stack";
import { Text } from "../components/ui/text";
import { Textarea } from "../components/ui/textarea";
import { toaster } from "../components/ui/toast";
import { TASK_PRIORITIES, TASK_STATUSES } from "../lib/tasks";
import { createTask, TaskSaveError } from "../utils/task-save";

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
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const emptyForm = (defaultProjectSlug?: string) => ({
	title: "",
	project: defaultProjectSlug ?? "",
	status: TASK_STATUSES[0],
	priority: "Medium",
	assignee: "",
	dueDate: "",
	tags: "",
	body: "",
});

// Same "no live backend" constraint as every other task editor (see
// TaskEditableText) — this commits straight to the git host via
// createTask/task-save.ts (Sveltia's session token, or our manually-connected
// one) when one is available, and otherwise falls back to a link into the
// CMS's own "new entry" screen rather than pretending to have saved anything.
export default function TaskCreateDrawer(props: TaskCreateDrawerProps) {
	const [form, setForm] = useState(emptyForm(props.defaultProjectSlug));
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const resetAndClose = () => {
		setForm(emptyForm(props.defaultProjectSlug));
		setError(null);
		props.onOpenChange(false);
	};

	const handleCreate = async () => {
		if (!form.title.trim() || !form.project) return;
		setSaving(true);
		setError(null);
		try {
			const slug = await createTask({
				title: form.title.trim(),
				project: form.project,
				status: form.status,
				priority: form.priority,
				assignee: form.assignee.trim() || undefined,
				dueDate: form.dueDate || undefined,
				tags: form.tags
					.split(",")
					.map((tag) => tag.trim())
					.filter(Boolean),
				body: form.body.trim() || undefined,
			});
			toaster.success(`Created "${form.title.trim()}".`, {
				description: "Committed to main — live once the site rebuilds.",
			});
			resetAndClose();
			void slug;
		} catch (err) {
			setError(
				err instanceof TaskSaveError || err instanceof Error
					? err.message
					: "Failed to create the task.",
			);
		} finally {
			setSaving(false);
		}
	};

	const canCreate = form.title.trim().length > 0 && form.project.length > 0;

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
			title="New Task"
			description="Creates a task file and commits it to main — same as the CMS."
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
						onClick={() => void handleCreate()}
						disabled={!canCreate || saving}
						class={cx(button({ variant: "solid", size: "sm" }))}
					>
						{saving ? "Creating..." : "Create task"}
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

					<Field
						label="Tags"
						helperText="Comma-separated"
						value={form.tags}
						onValueChange={(value: string) =>
							setForm((f) => ({ ...f, tags: value }))
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
								href="/admin/#/collections/tasks/entries/new"
								target="_blank"
								variant="plain"
							>
								Create it in the CMS
							</Anchor>{" "}
							instead.
						</Text>
					)}
				</Stack>
			}
		/>
	);
}
