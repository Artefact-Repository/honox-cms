import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { useEffect, useState } from "hono/jsx";
import { Dialog } from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import { Stack } from "../components/ui/stack";
import { Text } from "../components/ui/text";
import { toaster } from "../components/ui/toast";
import type { Task } from "../lib/tasks";
import { cloneTask, TaskSaveError } from "../utils/task-save";

export interface TaskCloneActionProps {
	tasks: Task[];
}

// Same singleton + click-delegation pattern as TaskDetailsDrawer /
// TaskDeleteConfirm (see those files): a live island can't be nested
// directly in `hoverActions` once the table has a sortable column, since
// TableSortIsland hydrates by cloning already-rendered DOM rather than
// re-executing it. Each row only renders a static `[data-task-clone-trigger]`
// button; this island, mounted once, looks the task up from its own props
// and prompts for the copy's name before it commits a new file straight to
// main (same direct-commit model as every other task editor here).
export default function TaskCloneAction({ tasks }: TaskCloneActionProps) {
	const [task, setTask] = useState<Task | null>(null);
	const [title, setTitle] = useState("");
	const [cloning, setCloning] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const bySlug = new Map(tasks.map((t) => [t.slug, t]));
		const onClick = (event: MouseEvent) => {
			const trigger = (event.target as HTMLElement)?.closest?.(
				"[data-task-clone-trigger]",
			);
			if (!trigger) return;
			const slug = trigger.getAttribute("data-task-slug");
			const found = slug ? bySlug.get(slug) : undefined;
			if (found) {
				setError(null);
				setTitle(`${found.title} (Copy)`);
				setTask(found);
			}
		};
		document.addEventListener("click", onClick);
		return () => document.removeEventListener("click", onClick);
	}, [tasks]);

	const close = () => {
		if (cloning) return;
		setTask(null);
		setError(null);
	};

	const handleClone = async () => {
		if (!task) return;
		const trimmed = title.trim();
		if (!trimmed) {
			setError("Enter a name for the copy.");
			return;
		}
		setCloning(true);
		setError(null);
		try {
			await cloneTask(task.slug, trimmed);
			toaster.success(`Cloned "${task.title}" as "${trimmed}".`, {
				description: "Committed to main — live once the site rebuilds.",
			});
			setTask(null);
		} catch (err) {
			setError(
				err instanceof TaskSaveError || err instanceof Error
					? err.message
					: "Failed to clone the task.",
			);
		} finally {
			setCloning(false);
		}
	};

	return (
		<Dialog
			open={task != null}
			onOpenChange={(next: boolean) => {
				if (!next) close();
			}}
			title={task ? `Clone "${task.title}"` : "Clone task"}
			description="Creates a new task file with the same fields and commits it straight to main."
		>
			<Stack direction="column" gap="4" class={css({ alignItems: "stretch" })}>
				<Field
					label="New task name"
					value={title}
					onValueChange={setTitle}
					required
				/>

				{error && (
					<Text size="sm" class={css({ color: "fg.error" })}>
						{error}
					</Text>
				)}

				<Stack gap="3" justify="end">
					<button
						type="button"
						onClick={close}
						disabled={cloning}
						class={cx(button({ variant: "outline", size: "sm" }))}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => void handleClone()}
						disabled={cloning || !title.trim()}
						class={cx(button({ variant: "solid", size: "sm" }))}
					>
						{cloning ? "Cloning..." : "Clone"}
					</button>
				</Stack>
			</Stack>
		</Dialog>
	);
}
