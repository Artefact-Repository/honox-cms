import { useEffect } from "hono/jsx";
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
// re-executing it. Unlike those two, cloning is non-destructive and doesn't
// need a confirmation step or any drawer/dialog UI, so there's no React
// state here at all — the trigger button's own DOM node is mutated directly
// for in-flight feedback (disabled + "Cloning..."), same technique
// TableSortIsland uses for its sort indicators.
export default function TaskCloneAction({ tasks }: TaskCloneActionProps) {
	useEffect(() => {
		const bySlug = new Map(tasks.map((t) => [t.slug, t]));
		const onClick = (event: MouseEvent) => {
			const trigger = (event.target as HTMLElement)?.closest?.(
				"[data-task-clone-trigger]",
			);
			if (!(trigger instanceof HTMLButtonElement)) return;
			const slug = trigger.getAttribute("data-task-slug");
			const task = slug ? bySlug.get(slug) : undefined;
			if (!task) return;

			const originalLabel = trigger.textContent;
			trigger.disabled = true;
			trigger.textContent = "Cloning...";

			void cloneTask(task.slug)
				.then(() => {
					toaster.success(`Cloned "${task.title}".`, {
						description: "Committed to main — live once the site rebuilds.",
					});
				})
				.catch((err: unknown) => {
					toaster.error(
						err instanceof TaskSaveError || err instanceof Error
							? err.message
							: "Failed to clone the task.",
					);
				})
				.finally(() => {
					trigger.disabled = false;
					trigger.textContent = originalLabel;
				});
		};
		document.addEventListener("click", onClick);
		return () => document.removeEventListener("click", onClick);
	}, [tasks]);

	return null;
}
