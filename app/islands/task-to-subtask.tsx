import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useState } from "hono/jsx";
import { InteractiveCombobox } from "../components/ui/combobox-primitive";
import { Dialog } from "../components/ui/dialog";
import { Stack } from "../components/ui/stack";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import { convertTaskToSubtask, TaskSaveError } from "../utils/task-save";

export interface TaskToSubtaskProps {
	slug: string;
	title: string;
	/** Candidate parents — every other task except this one and its own
	 * descendants (see `descendantsOf` in lib/tasks.ts for why those are
	 * excluded). */
	tasks: { label: string; value: string }[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * "Convert to... Subtask" — sets this task's `parentTask` to another task
 * picked from a searchable id/slug/name combobox, via the same direct-commit
 * path as every other inline task editor (see `saveTaskField`). Only ever
 * mounted once, for the current task, from the detail page's "..." menu —
 * unlike TaskCloneDialog/TaskDeleteDialog it doesn't need a nullable `task`
 * prop shared across table rows.
 */
export default function TaskToSubtask({
	slug,
	title,
	tasks,
	open,
	onOpenChange,
}: TaskToSubtaskProps) {
	const [parentSlug, setParentSlug] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const close = () => {
		if (saving) return;
		onOpenChange(false);
		setError(null);
	};

	const handleConvert = async () => {
		if (!parentSlug) return;
		setSaving(true);
		setError(null);
		try {
			await convertTaskToSubtask(slug, parentSlug);
			toaster.success(`Made "${title}" a subtask.`, {
				description: "Committed to main — live once the site rebuilds.",
			});
			onOpenChange(false);
			setParentSlug("");
		} catch (err) {
			setError(
				err instanceof TaskSaveError || err instanceof Error
					? err.message
					: "Failed to convert the task.",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next: boolean) => {
				if (!next) close();
			}}
			title={`Convert "${title}" to a subtask`}
			description="Sets a parent task and commits it straight to main."
			// Passed as `body`/`cancel`/`confirm` (not `children`) — Dialog only
			// applies the recipe's padding and the footer's top border/divider to
			// those dedicated slots; bare `children` renders unstyled between them
			// (see task-details-drawer.tsx for the same fix).
			body={
				<Stack
					direction="column"
					gap="4"
					class={css({ alignItems: "stretch", width: "full" })}
				>
					<div>
						<Text size="sm" class={css({ fontWeight: "medium", mb: "1.5" })}>
							Parent task
						</Text>
						<InteractiveCombobox
							items={tasks}
							value={parentSlug}
							onValueChange={setParentSlug}
							placeholder="Search by title or slug..."
							allowClear
							size="sm"
						/>
					</div>

					{error && (
						<Text size="sm" class={css({ color: "fg.error" })}>
							{error}
						</Text>
					)}
				</Stack>
			}
			cancel={
				<button
					type="button"
					disabled={saving}
					class={cx(button({ variant: "outline", size: "sm" }))}
				>
					Cancel
				</button>
			}
			confirm={
				<button
					type="button"
					onClick={() => void handleConvert()}
					disabled={saving || !parentSlug}
					class={cx(button({ variant: "solid", size: "sm" }))}
				>
					{saving ? "Converting..." : "Convert"}
				</button>
			}
		/>
	);
}
