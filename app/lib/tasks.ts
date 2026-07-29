import type { ColorPalette } from "../components/ui/color-palette";
import {
	markdownToHtml,
	parseFrontmatter,
	stripMarkdown,
} from "../utils/markdown";
import { buildHaystack, type SearchIndexEntry } from "../utils/search";

// Tasks content lives under content/tasks/*.md, one file per entry — same
// flat, non-i18n convention as app/lib/projects.ts, but markdown+frontmatter
// (like app/lib/posts.ts) instead of flat JSON, so the description can be
// real formatted markdown. Each task's `project` field is a
// projects-collection slug (the CMS's `relation` widget writes the related
// entry's slug as a plain string, same shape a hand-authored file has here).
const taskModules = (
	typeof import.meta.glob === "function"
		? import.meta.glob("/content/tasks/*.md", {
				query: "?raw",
				import: "default",
			})
		: {}
) as Record<string, () => Promise<string>>;

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
	tags: string[];
	/** Plain-text excerpt of the markdown body, for tables/search previews. */
	excerpt: string;
}

/** `Task` plus the markdown body, for the detail page. */
export interface TaskDetail extends Task {
	html: string;
	/** Raw (untruncated) markdown source of the body — for inline editing. */
	body: string;
}

function slugFromPath(path: string): string {
	const match = path.match(/^\/content\/tasks\/([^/]+)\.md$/);
	if (!match) throw new Error(`Unexpected task content path: ${path}`);
	return match[1]!;
}

function buildTask(
	slug: string,
	data: Record<string, unknown>,
	content: string,
): Task {
	return {
		slug,
		title: (data.title as string) || slug,
		project: (data.project as string) ?? "",
		status: (data.status as TaskStatus) ?? "To Do",
		priority: (data.priority as TaskPriority) ?? "Medium",
		assignee: data.assignee as string | undefined,
		dueDate: data.dueDate as string | undefined,
		tags: (data.tags as string[]) ?? [],
		excerpt: stripMarkdown(content).slice(0, 200),
	};
}

async function loadTask(path: string): Promise<Task> {
	const loader = taskModules[path]!;
	const raw = await loader();
	const { data, content } = parseFrontmatter(raw);
	return buildTask(slugFromPath(path), data, content);
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

export async function loadTaskBySlug(
	slug: string,
): Promise<TaskDetail | undefined> {
	const path = `/content/tasks/${slug}.md`;
	const loader = taskModules[path];
	if (!loader) return undefined;
	const raw = await loader();
	const { data, content } = parseFrontmatter(raw);
	return {
		...buildTask(slug, data, content),
		html: markdownToHtml(content),
		body: content,
	};
}

/** All task slugs, for ssgParams. */
export function listTaskSlugs(): string[] {
	return Object.keys(taskModules).map((path) => slugFromPath(path));
}

export function buildTaskSearchEntries(
	tasks: Task[],
	projectTitleBySlug: Map<string, string> = new Map(),
): SearchIndexEntry[] {
	return tasks.map((task) => ({
		key: task.slug,
		href: `/tasks/${task.slug}`,
		title: task.title,
		description: task.excerpt,
		tags: task.tags,
		haystack: buildHaystack([
			task.title,
			task.excerpt,
			task.tags,
			task.status,
			task.priority,
			task.assignee,
			projectTitleBySlug.get(task.project),
		]),
	}));
}
