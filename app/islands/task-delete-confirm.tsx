import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";
import { colorPaletteClass } from "../components/ui/color-palette";
import { Dialog } from "../components/ui/dialog";
import { Stack } from "../components/ui/stack";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import type { Task } from "../lib/tasks";
import { deleteTask, TaskSaveError } from "../utils/task-save";

export interface TaskDeleteConfirmProps {
	tasks: Task[];
}

// Same singleton + click-delegation pattern as TaskDetailsDrawer (see that
// file): a live island can't be nested directly in `hoverActions` once the
// table has a sortable column, since TableSortIsland hydrates by cloning
// already-rendered DOM rather than re-executing it. Each row only renders a
// static `[data-task-delete-trigger]` button; this island, mounted once,
// looks the task up from its own props and confirms before it commits an
// actual file deletion straight to main (same direct-commit model as every
// other task editor here — see task-save.ts).
export default function TaskDeleteConfirm({ tasks }: TaskDeleteConfirmProps) {
	const [task, setTask] = useState<Task | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const bySlug = new Map(tasks.map((t) => [t.slug, t]));
		const onClick = (event: MouseEvent) => {
			const trigger = (event.target as HTMLElement)?.closest?.(
				"[data-task-delete-trigger]",
			);
			if (!trigger) return;
			const slug = trigger.getAttribute("data-task-slug");
			const found = slug ? bySlug.get(slug) : undefined;
			if (found) {
				setError(null);
				setTask(found);
			}
		};
		document.addEventListener("click", onClick);
		return () => document.removeEventListener("click", onClick);
	}, [tasks]);

	const close = () => {
		if (deleting) return;
		setTask(null);
		setError(null);
	};

	const handleDelete = async () => {
		if (!task) return;
		setDeleting(true);
		setError(null);
		try {
			await deleteTask(task.slug);
			document.getElementById(`task-${task.slug}`)?.remove();
			toaster.success(`Deleted "${task.title}".`, {
				description: "Committed to main — live once the site rebuilds.",
			});
			setTask(null);
		} catch (err) {
			setError(
				err instanceof TaskSaveError || err instanceof Error
					? err.message
					: "Failed to delete the task.",
			);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<Dialog
			open={task != null}
			onOpenChange={(next: boolean) => {
				if (!next) close();
			}}
			role="alertdialog"
			title={task ? `Delete "${task.title}"?` : "Delete task?"}
			description="This removes the task file and commits straight to main — it can't be undone from here."
		>
			<Stack direction="column" gap="4" class={css({ alignItems: "stretch" })}>
				{error && (
					<Text size="sm" class={css({ color: "fg.error" })}>
						{error}
					</Text>
				)}

				<Stack gap="3" justify="end">
					<button
						type="button"
						onClick={close}
						disabled={deleting}
						class={cx(button({ variant: "outline", size: "sm" }))}
					>
						Cancel
					</button>
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
				</Stack>
			</Stack>
		</Dialog>
	);
}
