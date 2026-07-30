import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useState } from "hono/jsx";
import { colorPaletteClass } from "../components/ui/color-palette";
import { Dialog } from "../components/ui/dialog";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import { deleteTask, TaskSaveError } from "../utils/task-save";

export interface TaskDeleteDialogProps {
	task: { slug: string; title: string } | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Called after the file is actually deleted, so each caller can update
	 * its own view — removing a table row vs. navigating away from the task's
	 * own detail page. */
	onDeleted?: (slug: string) => void;
}

/**
 * Controlled delete-confirmation dialog shared by TaskDeleteConfirm (the
 * tasks table's click-delegated trigger) and the task detail page's "..."
 * menu — both just hand it a `{ slug, title }` and let it own the confirm
 * prompt and the actual delete call.
 */
export default function TaskDeleteDialog({
	task,
	open,
	onOpenChange,
	onDeleted,
}: TaskDeleteDialogProps) {
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const close = () => {
		if (deleting) return;
		onOpenChange(false);
		setError(null);
	};

	const handleDelete = async () => {
		if (!task) return;
		setDeleting(true);
		setError(null);
		try {
			await deleteTask(task.slug);
			toaster.success(`Deleted "${task.title}".`, {
				description: "Committed to main — live once the site rebuilds.",
			});
			onOpenChange(false);
			onDeleted?.(task.slug);
		} catch (err) {
			const message =
				err instanceof TaskSaveError || err instanceof Error
					? err.message
					: "Failed to delete the task.";
			// Toasted (not just shown inline) so a failure — e.g. a 404 from a
			// git host permission gap — is never missed (see task-create-drawer's
			// same fix).
			toaster.error(message);
			setError(message);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next: boolean) => {
				if (!next) close();
			}}
			role="alertdialog"
			title={task ? `Delete "${task.title}"?` : "Delete task?"}
			description="This removes the task file and commits straight to main — it can't be undone from here."
			// Passed as `body`/`cancel`/`confirm` (not `children`) — Dialog only
			// applies the recipe's padding and the footer's top border/divider
			// to those dedicated slots; bare `children` renders unstyled between
			// them (see task-details-drawer.tsx for the same fix).
			body={
				error ? (
					<Text size="sm" class={css({ color: "fg.error" })}>
						{error}
					</Text>
				) : undefined
			}
			cancel={
				<button
					type="button"
					disabled={deleting}
					class={cx(button({ variant: "outline", size: "sm" }))}
				>
					Cancel
				</button>
			}
			confirm={
				<button
					type="button"
					onClick={() => void handleDelete()}
					disabled={deleting}
					class={cx(
						button({ variant: "solid", size: "sm" }),
						colorPaletteClass("red"),
					)}
				>
					{deleting ? "Deleting..." : "Delete"}
				</button>
			}
		/>
	);
}
