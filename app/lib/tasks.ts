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
	/** Slug of another task in this same collection, if this is a subtask. */
	parentTask?: string;
	/** Manual position among sibling tasks (same `parentTask`, or same
	 * top-level bucket) — set by dragging a row in the tasks table
	 * (see `task-tree-dnd.tsx`). Unset by default; siblings without one fall
	 * back to their natural due-date order (see `buildTaskTree`). */
	order?: number;
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
		parentTask: (data.parentTask as string) || undefined,
		order: typeof data.order === "number" ? data.order : undefined,
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

/** Direct children of `parentSlug` — takes an already-loaded task list
 * (rather than re-reading the collection) since every caller already has
 * one in hand via `listTasks`/`listTasksByProject`. */
export function subtasksOf(tasks: Task[], parentSlug: string): Task[] {
	return tasks.filter((task) => task.parentTask === parentSlug);
}

export interface TaskTreeEntry {
	task: Task;
	depth: number;
	hasChildren: boolean;
	/** This task's resolved position among its siblings — `task.order` if
	 * set, otherwise an implied value spaced by `TASK_ORDER_GAP` off its
	 * due-date-sorted position. Exposed (as `data-order-key` in the table) so
	 * `task-tree-dnd.tsx` can compute a midpoint between two siblings' keys
	 * for a dropped task without needing every sibling to have an explicit
	 * `order` already. */
	orderKey: number;
}

/** Spacing between implied sibling order keys — wide enough that a dragged
 * task can be dropped between any two siblings (real or implied) by taking
 * their midpoint, indefinitely, without ever needing to renumber the rest of
 * the group (each drop is one task's own file, one git commit). */
export const TASK_ORDER_GAP = 1000;

function sortSiblings(tasks: Task[]): Array<{ task: Task; orderKey: number }> {
	return tasks
		.map((task, index) => ({
			task,
			orderKey: task.order ?? index * TASK_ORDER_GAP,
		}))
		.sort((a, b) => a.orderKey - b.orderKey);
}

/** Reorders `tasks` so each task is immediately followed by its subtasks
 * (recursively), for table/board views that want to render subtasks nested
 * under their parent instead of flat — within each sibling group, tasks with
 * an explicit `order` are positioned by it; the rest keep their relative
 * due-date order (see `sortSiblings`). A task whose `parentTask` doesn't
 * resolve to another task in this same list — filtered out of a scoped
 * view, or simply not passed in — is treated as top-level, so filtered views
 * degrade to showing it flat rather than dropping it. Also tolerates a
 * `parentTask` cycle (only possible via hand-edited frontmatter, since the
 * UI never offers a task's own descendant as its parent): every task in the
 * loop renders top-level instead of vanishing from the tree. */
export function buildTaskTree(tasks: Task[]): TaskTreeEntry[] {
	const bySlug = new Map(tasks.map((task) => [task.slug, task]));

	const isTopLevel = (task: Task): boolean => {
		if (!task.parentTask) return true;
		const seen = new Set<string>([task.slug]);
		let current = task;
		while (current.parentTask) {
			const parent = bySlug.get(current.parentTask);
			if (!parent || seen.has(parent.slug)) return true;
			seen.add(parent.slug);
			current = parent;
		}
		return false;
	};

	const childrenBySlug = new Map<string, Task[]>();
	const topLevel: Task[] = [];
	for (const task of tasks) {
		if (isTopLevel(task)) {
			topLevel.push(task);
			continue;
		}
		const parentSlug = task.parentTask as string;
		const siblings = childrenBySlug.get(parentSlug) ?? [];
		siblings.push(task);
		childrenBySlug.set(parentSlug, siblings);
	}

	const sortedChildrenBySlug = new Map<
		string,
		Array<{ task: Task; orderKey: number }>
	>();
	for (const [slug, children] of childrenBySlug) {
		sortedChildrenBySlug.set(slug, sortSiblings(children));
	}

	const entries: TaskTreeEntry[] = [];
	const visit = (task: Task, depth: number, orderKey: number) => {
		const children = sortedChildrenBySlug.get(task.slug) ?? [];
		entries.push({ task, depth, hasChildren: children.length > 0, orderKey });
		for (const child of children) visit(child.task, depth + 1, child.orderKey);
	};
	for (const top of sortSiblings(topLevel)) visit(top.task, 0, top.orderKey);
	return entries;
}

/** Root tasks rendered per page of the `/tasks` table's pagination — see
 * `paginateTaskTree`. */
export const TASKS_PAGE_SIZE = 25;

export interface PaginatedTaskTree {
	entries: TaskTreeEntry[];
	/** Clamped into `[1, totalPages]`, so an out-of-range `?page=` (stale
	 * link, hand-edited URL) degrades to the nearest valid page instead of
	 * rendering empty. */
	page: number;
	totalPages: number;
	/** Root (depth 0) task count — what pagination is measured in, not the
	 * flat entry count, so a page always holds whole subtrees. */
	totalRootCount: number;
}

/** Slices `taskTree` (from `buildTaskTree`) into `pageSize` root subtrees per
 * page — a root task and all of its (recursively) nested subtasks always
 * land on the same page together, since `buildTaskTree`'s pre-order walk
 * keeps each subtree contiguous. */
export function paginateTaskTree(
	taskTree: TaskTreeEntry[],
	page: number,
	pageSize: number,
): PaginatedTaskTree {
	const rootIndices: number[] = [];
	taskTree.forEach((entry, index) => {
		if (entry.depth === 0) rootIndices.push(index);
	});
	const totalRootCount = rootIndices.length;
	const totalPages = Math.max(1, Math.ceil(totalRootCount / pageSize));
	const clampedPage = Math.min(Math.max(1, page), totalPages);
	const startIndex = rootIndices[(clampedPage - 1) * pageSize] ?? taskTree.length;
	const endIndex = rootIndices[clampedPage * pageSize] ?? taskTree.length;
	return {
		entries: taskTree.slice(startIndex, endIndex),
		page: clampedPage,
		totalPages,
		totalRootCount,
	};
}

/** Every task nested (directly or transitively) under `slug`, via
 * `buildTaskTree` — entries in a pre-order tree walk are contiguous, so
 * everything after `slug`'s own entry with a greater depth is its subtree.
 * Used to keep "convert to subtask" pickers from offering a task's own
 * descendant as its new parent — `buildTaskTree`'s cycle guard would
 * otherwise just silently flatten the result back to top-level instead of
 * actually nesting it. */
export function descendantsOf(tasks: Task[], slug: string): Task[] {
	const tree = buildTaskTree(tasks);
	const index = tree.findIndex((entry) => entry.task.slug === slug);
	if (index === -1) return [];
	const depth = tree[index].depth;
	const descendants: Task[] = [];
	for (let i = index + 1; i < tree.length && tree[i].depth > depth; i++) {
		descendants.push(tree[i].task);
	}
	return descendants;
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
