// Shared save path for every inline task editor (title, project, assignee,
// description, tags) — same direct-commit mechanism as the project board's
// drag-and-drop (see app/islands/task-board.tsx), just editing a different
// field each time. All of it funnels through here so there's one place that
// knows the file path convention and the fetch→edit→write sequence. Works
// against whichever git backend is configured (see git-backend.ts).
import { fetchFile, resolveToken, updateFile } from "./git-backend";
import { parseFrontmatter, stringifyFrontmatter } from "./markdown";

export interface TaskFieldUpdate {
	/** Mutate frontmatter fields, return the (possibly unchanged) body. */
	data?: Record<string, unknown>;
	/** Replace the markdown body (task description); omit to leave it as-is. */
	content?: string;
}

export class TaskSaveError extends Error {}

/** Resolves a token (Sveltia's session, or our own manual one) the same way
 * the project board does — throws a user-facing message if neither is
 * available, so callers can just try/catch and show it. */
export function requireToken(): string {
	const { token } = resolveToken();
	if (!token) {
		throw new TaskSaveError(
			"No git host connection found — connect one to save edits.",
		);
	}
	return token;
}

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
