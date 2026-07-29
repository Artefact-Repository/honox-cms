import { useEffect, useState } from "hono/jsx";
import type { Task } from "../lib/tasks";
import TaskCloneDialog from "./task-clone-dialog";

export interface TaskCloneActionProps {
	tasks: Task[];
}

// Same singleton + click-delegation pattern as TaskDetailsDrawer /
// TaskDeleteConfirm (see those files): a live island can't be nested
// directly in `hoverActions` once the table has a sortable column, since
// TableSortIsland hydrates by cloning already-rendered DOM rather than
// re-executing it. Each row only renders a static `[data-task-clone-trigger]`
// button; this island, mounted once, looks the task up from its own props
// and hands it to TaskCloneDialog (shared with the task detail page's
// "..." menu) to prompt for the copy's name and commit it to main.
export default function TaskCloneAction({ tasks }: TaskCloneActionProps) {
	const [task, setTask] = useState<Task | null>(null);

	useEffect(() => {
		const bySlug = new Map(tasks.map((t) => [t.slug, t]));
		const onClick = (event: MouseEvent) => {
			const trigger = (event.target as HTMLElement)?.closest?.(
				"[data-task-clone-trigger]",
			);
			if (!trigger) return;
			const slug = trigger.getAttribute("data-task-slug");
			const found = slug ? bySlug.get(slug) : undefined;
			if (found) setTask(found);
		};
		document.addEventListener("click", onClick);
		return () => document.removeEventListener("click", onClick);
	}, [tasks]);

	return (
		<TaskCloneDialog
			task={task}
			open={task != null}
			onOpenChange={(next) => {
				if (!next) setTask(null);
			}}
		/>
	);
}
