// Shared save path for every inline task editor (title, project, assignee,
// description, tags) — same direct-commit mechanism as the project board's
// drag-and-drop (see app/islands/task-board.tsx), just editing a different
// field each time. All of it funnels through here so there's one place that
// knows the file path convention and the fetch→edit→write sequence. Works
// against whichever git backend is configured (see git-backend.ts).
import {
	createFile,
	createFiles,
	deleteFile,
	fetchFile,
	fileExists,
	requireToken,
	updateFile,
} from "./git-backend";
import { parseFrontmatter, stringifyFrontmatter } from "./markdown";
import { slugify } from "./slug";

export interface TaskFieldUpdate {
	/** Mutate frontmatter fields, return the (possibly unchanged) body. */
	data?: Record<string, unknown>;
	/** Replace the markdown body (task description); omit to leave it as-is. */
	content?: string;
}

export class TaskSaveError extends Error {}

export async function saveTaskField(
	slug: string,
	update: (data: Record<string, unknown>, content: string) => TaskFieldUpdate,
): Promise<void> {
	const token = requireToken();
	const path = `content/tasks/${slug}.md`;
	const file = await fetchFile(path, token);
	const { data, content } = parseFrontmatter(file.content);
	const patch = update(data, content);
	const newFileContent = stringifyFrontmatter(
		patch.data ?? data,
		patch.content ?? content,
	);
	await updateFile(
		path,
		newFileContent,
		file.sha,
		`Update task "${slug}"`,
		token,
	);
}

/** Deletes `content/tasks/{slug}.md` straight on the git host — same
 * fetch-then-write path as `saveTaskField`, just a delete instead of a write. */
export async function deleteTask(slug: string): Promise<void> {
	const token = requireToken();
	const path = `content/tasks/${slug}.md`;
	const file = await fetchFile(path, token);
	await deleteFile(path, file.sha, `Delete task "${slug}"`, token);
}

/** Clears `parentTask` on an existing task — the task detail page's
 * "Convert to... Task" action, offered instead of "...Subtask" once a task
 * already has a parent (see task-actions-menu.tsx). Same direct-commit path
 * as every other field edit; `data.parentTask = undefined` is enough to drop
 * the key entirely, since `stringifyFrontmatter`'s YAML serializer omits
 * `undefined` values the same way `JSON.stringify` would. */
export async function convertTaskToTopLevel(slug: string): Promise<void> {
	await saveTaskField(slug, (data) => ({
		data: { ...data, parentTask: undefined },
	}));
}

/** Reads back `content/tasks/{slug}.md`'s parsed frontmatter and raw body —
 * used by the tasks table's Edit drawer to prefill its form, since the list
 * page's `Task` type only carries a truncated `excerpt`, not the full body. */
export async function fetchTaskContent(
	slug: string,
): Promise<{ data: Record<string, unknown>; body: string }> {
	const token = requireToken();
	const file = await fetchFile(`content/tasks/${slug}.md`, token);
	const { data, content } = parseFrontmatter(file.content);
	return { data, body: content };
}

/** Turns a task title into the same kind of slug the CMS's `{{slug}}`
 * pattern would produce, so hand-created and CMS-created task files stay
 * consistent (see public/admin/config.yml's tasks collection). */
export function slugifyTaskTitle(title: string): string {
	return slugify(title) || "task";
}

export interface NewTaskInput {
	title: string;
	project: string;
	/** Slug of another task, if this one is being created as a subtask. */
	parentTask?: string;
	status: string;
	priority: string;
	assignee?: string;
	dueDate?: string;
	tags: string[];
	body?: string;
}

/** Creates `content/tasks/{slug}.md` straight on the git host, same
 * direct-commit path as `saveTaskField`. Checks the path is free first (a
 * plain 404 from `fetchFile`) since create/update use different API calls
 * (see `createFile` in git-backend.ts) and can't rely on a single
 * conflict-status check across every backend. */
export async function createTasksBulk(
	items: NewTaskInput[],
	message = "AI bulk tasks creation",
): Promise<void> {
	const token = requireToken();
	const filesToCommit: { path: string; content: string }[] = [];

	for (const item of items) {
		const baseSlug = slugifyTaskTitle(item.title);
		let cloneSlug = baseSlug;
		let attempt = 2;
		while (await fileExists(`content/tasks/${cloneSlug}.md`, token)) {
			cloneSlug = `${baseSlug}-${attempt}`;
			attempt += 1;
		}
		const path = `content/tasks/${cloneSlug}.md`;

		const data: Record<string, unknown> = {
			title: item.title,
			project: item.project,
			status: item.status,
			priority: item.priority,
		};
		if (item.parentTask) data.parentTask = item.parentTask;
		if (item.assignee) data.assignee = item.assignee;
		if (item.dueDate) data.dueDate = item.dueDate;
		if (item.tags && item.tags.length > 0) data.tags = item.tags;

		const content = stringifyFrontmatter(data, item.body ?? "");
		filesToCommit.push({ path, content });
	}

	await createFiles(filesToCommit, message, token);
}

export async function createTask(input: NewTaskInput): Promise<string> {
	const token = requireToken();
	const slug = slugifyTaskTitle(input.title);
	const path = `content/tasks/${slug}.md`;

	if (await fileExists(path, token)) {
		throw new TaskSaveError(
			`A task file already exists at "${path}" — use a different title.`,
		);
	}

	const data: Record<string, unknown> = {
		title: input.title,
		project: input.project,
		status: input.status,
		priority: input.priority,
	};
	if (input.parentTask) data.parentTask = input.parentTask;
	if (input.assignee) data.assignee = input.assignee;
	if (input.dueDate) data.dueDate = input.dueDate;
	if (input.tags.length > 0) data.tags = input.tags;

	const content = stringifyFrontmatter(data, input.body ?? "");
	await createFile(path, content, `Create task "${input.title}"`, token);
	return slug;
}

/** Overwrites every editable field of an existing `content/tasks/{slug}.md`
 * in place — the tasks table's Edit drawer's save, vs. `saveTaskField`'s
 * single-field patch used by each inline editor. `body` is optional so a
 * save made without touching the description (e.g. the prefill fetch failed)
 * leaves the existing body untouched instead of blanking it out. */
export async function updateTask(
	slug: string,
	input: NewTaskInput,
): Promise<void> {
	await saveTaskField(slug, (data, content) => ({
		data: {
			...data,
			title: input.title,
			project: input.project,
			parentTask: input.parentTask || undefined,
			status: input.status,
			priority: input.priority,
			assignee: input.assignee || undefined,
			dueDate: input.dueDate || undefined,
			tags: input.tags.length > 0 ? input.tags : undefined,
		},
		content: input.body ?? content,
	}));
}

/** Duplicates `content/tasks/{slug}.md` as a new file titled `newTitle` —
 * reads the source file's raw content first (rather than reconstructing it
 * from the list page's `Task`, which only carries a truncated `excerpt`) so
 * the full body survives the clone intact. Retries with a numeric suffix on
 * a slug collision (e.g. two clones typed to the same name). */
export async function cloneTask(
	slug: string,
	newTitle: string,
): Promise<string> {
	const token = requireToken();
	const title = newTitle.trim();
	if (!title) {
		throw new TaskSaveError("Enter a name for the copy.");
	}

	const source = await fetchFile(`content/tasks/${slug}.md`, token);
	const { data, content } = parseFrontmatter(source.content);
	const sourceTitle = (data.title as string) || slug;

	const baseSlug = slugifyTaskTitle(title);
	let cloneSlug = baseSlug;
	let attempt = 2;
	while (await fileExists(`content/tasks/${cloneSlug}.md`, token)) {
		cloneSlug = `${baseSlug}-${attempt}`;
		attempt += 1;
	}

	const newContent = stringifyFrontmatter({ ...data, title }, content);
	await createFile(
		`content/tasks/${cloneSlug}.md`,
		newContent,
		`Clone task "${sourceTitle}" as "${title}"`,
		token,
	);
	return cloneSlug;
}
