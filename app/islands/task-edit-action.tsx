import { useEffect, useState } from "hono/jsx";
import { toaster } from "../components/ui/toast";
import type { Task } from "../lib/tasks";
import { fetchTaskContent, TaskSaveError } from "../utils/task-save";
import TaskCreateDrawer from "./task-create-drawer";

export interface TaskEditActionProps {
	tasks: Task[];
	projects: { label: string; value: string }[];
	/** Candidate parent tasks for the drawer's "make this a subtask" field —
	 * the task currently being edited is filtered out of this list below, so
	 * it can't be set as its own parent. */
	taskItems: { label: string; value: string }[];
}

// Same singleton + click-delegation pattern as TaskCloneAction/TaskDeleteConfirm
// (see those files): a live island can't be nested directly in `hoverActions`
// once the table has a sortable column, since TableSortIsland hydrates by
// cloning already-rendered DOM rather than re-executing it. Each row only
// renders a static `[data-task-edit-trigger]` button; this island, mounted
// once, looks the task up from its own props and reuses TaskCreateDrawer (see
// its `editTask` prop) instead of a bespoke form. The row data only carries a
// truncated `excerpt`, so the task's full raw body is fetched straight from
// the git host before the drawer opens.
export default function TaskEditAction({
	tasks,
	projects,
	taskItems,
}: TaskEditActionProps) {
	const [editTask, setEditTask] = useState<
		{ task: Task; body: string } | undefined
	>(undefined);

	useEffect(() => {
		const bySlug = new Map(tasks.map((t) => [t.slug, t]));
		const onClick = (event: MouseEvent) => {
			const trigger = (event.target as HTMLElement)?.closest?.(
				"[data-task-edit-trigger]",
			);
			if (!trigger) return;
			const slug = trigger.getAttribute("data-task-slug");
			const task = slug ? bySlug.get(slug) : undefined;
			if (!task) return;
			void (async () => {
				try {
					const { body } = await fetchTaskContent(task.slug);
					setEditTask({ task, body });
				} catch (err) {
					toaster.error(
						err instanceof TaskSaveError || err instanceof Error
							? err.message
							: "Failed to load the task for editing.",
					);
				}
			})();
		};
		document.addEventListener("click", onClick);
		return () => document.removeEventListener("click", onClick);
	}, [tasks]);

	return (
		<TaskCreateDrawer
			projects={projects}
			tasks={taskItems.filter((item) => item.value !== editTask?.task.slug)}
			editTask={editTask}
			open={editTask != null}
			onOpenChange={(next) => {
				if (!next) setEditTask(undefined);
			}}
		/>
	);
}
