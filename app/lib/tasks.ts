import type { ColorPalette } from "../components/ui/color-palette";

// Tasks content lives under content/tasks/*.json, one file per entry — same
// flat, non-i18n convention as app/lib/projects.ts. Each task's `project`
// field is a projects-collection slug (the CMS's `relation` widget writes
// the related entry's slug as a plain string, same shape a hand-authored
// file has here).
const taskModules = import.meta.glob("/content/tasks/*.json", {
	import: "default",
}) as Record<string, () => Promise<unknown>>;

export type TaskStatus = "To Do" | "In Progress" | "In Review" | "Done";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export const TASK_STATUSES: TaskStatus[] = [
	"To Do",
	"In Progress",
	"In Review",
	"Done",
];

export const TASK_PRIORITIES: TaskPriority[] = [
	"Low",
	"Medium",
	"High",
	"Urgent",
];

export const TASK_STATUS_COLOR: Record<TaskStatus, ColorPalette> = {
	"To Do": "gray",
	"In Progress": "blue",
	"In Review": "purple",
	Done: "green",
};

export const TASK_PRIORITY_COLOR: Record<TaskPriority, ColorPalette> = {
	Low: "gray",
	Medium: "blue",
	High: "orange",
	Urgent: "red",
};

export interface Task {
	slug: string;
	title: string;
	project: string;
	status: TaskStatus;
	priority: TaskPriority;
	assignee?: string;
	dueDate?: string;
	description?: string;
	tags: string[];
}

function slugFromPath(path: string): string {
	const match = path.match(/^\/content\/tasks\/([^/]+)\.json$/);
	if (!match) throw new Error(`Unexpected task content path: ${path}`);
	return match[1]!;
}

async function loadTask(path: string): Promise<Task> {
	const loader = taskModules[path]!;
	const data = (await loader()) as Partial<Task>;
	return {
		slug: slugFromPath(path),
		title: data.title ?? slugFromPath(path),
		project: data.project ?? "",
		status: (data.status as TaskStatus) ?? "To Do",
		priority: (data.priority as TaskPriority) ?? "Medium",
		assignee: data.assignee,
		dueDate: data.dueDate,
		description: data.description,
		tags: data.tags ?? [],
	};
}

/** Every task across every project, sorted by due date (undated tasks last). */
export async function listTasks(): Promise<Task[]> {
	const tasks = await Promise.all(
		Object.keys(taskModules).map((path) => loadTask(path)),
	);
	tasks.sort((a, b) => {
		if (!a.dueDate && !b.dueDate) return a.title.localeCompare(b.title);
		if (!a.dueDate) return 1;
		if (!b.dueDate) return -1;
		return a.dueDate.localeCompare(b.dueDate);
	});
	return tasks;
}

export async function listTasksByProject(projectSlug: string): Promise<Task[]> {
	const tasks = await listTasks();
	return tasks.filter((task) => task.project === projectSlug);
}
