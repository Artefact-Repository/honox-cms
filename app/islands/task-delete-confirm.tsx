import { useEffect, useState } from "hono/jsx";
import type { Task } from "../lib/tasks";
import TaskDeleteDialog from "./task-delete-dialog";

export interface TaskDeleteConfirmProps {
	tasks: Task[];
}

// Same singleton + click-delegation pattern as TaskDetailsDrawer (see that
// file): a live island can't be nested directly in `hoverActions` once the
// table has a sortable column, since TableSortIsland hydrates by cloning
// already-rendered DOM rather than re-executing it. Each row only renders a
// static `[data-task-delete-trigger]` button; this island, mounted once,
// looks the task up from its own props and hands it to TaskDeleteDialog
// (shared with the task detail page's "..." menu) to confirm before it
// commits an actual file deletion straight to main.
export default function TaskDeleteConfirm({ tasks }: TaskDeleteConfirmProps) {
	const [task, setTask] = useState<Task | null>(null);

	useEffect(() => {
		const bySlug = new Map(tasks.map((t) => [t.slug, t]));
		const onClick = (event: MouseEvent) => {
			const trigger = (event.target as HTMLElement)?.closest?.(
				"[data-task-delete-trigger]",
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
		<TaskDeleteDialog
			task={task}
			open={task != null}
			onOpenChange={(next) => {
				if (!next) setTask(null);
			}}
			onDeleted={(slug) => {
				document.getElementById(`task-${slug}`)?.remove();
			}}
		/>
	);
}
