import { TASK_PRIORITY_COLOR, type TaskPriority } from "../lib/tasks";
import ProjectCreateDrawer from "./project-create-drawer";

export interface TaskToProjectProps {
	slug: string;
	title: string;
	excerpt: string;
	priority: TaskPriority;
	assignee?: string;
	dueDate?: string;
	tags: string[];
	/** Controlled from outside — this has no trigger of its own; the caller
	 * (the "..." actions dropdown) owns when it opens. */
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * "Convert to Project" — opens the same New Project drawer the header's "+
 * New" menu uses, prefilled from the source task's own fields (title as the
 * project title, its description as the project description, priority
 * mapped to a color, assignee as owner, due date, tags). No summary prefill:
 * a task has nothing that reads as a one-line project summary, so that field
 * is left for the user to write.
 */
export default function TaskToProject(props: TaskToProjectProps) {
	const { open, onOpenChange, ...task } = props;

	return (
		<ProjectCreateDrawer
			open={open}
			onOpenChange={onOpenChange}
			initialValues={{
				title: task.title,
				description: task.excerpt,
				status: "Planning",
				colorPalette: TASK_PRIORITY_COLOR[task.priority],
				owner: task.assignee,
				startDate: new Date().toISOString().slice(0, 10),
				dueDate: task.dueDate,
				tags: task.tags,
			}}
		/>
	);
}
