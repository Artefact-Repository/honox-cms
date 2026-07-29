// Direct-commit create path for the projects collection — same
// fetch/check/write flow as app/utils/task-save.ts, just writing plain JSON
// (content/projects/*.json, see app/lib/projects.ts) instead of
// frontmatter+markdown.
import { createFile, fileExists, requireToken } from "./git-backend";
import { slugify } from "./slug";

export class ProjectSaveError extends Error {}

/** Turns a project title into the same kind of slug the CMS's `{{slug}}`
 * pattern would produce, so hand-created and CMS-created project files stay
 * consistent (see public/admin/config.yml's projects collection). */
export function slugifyProjectTitle(title: string): string {
	return slugify(title) || "project";
}

export interface NewProjectInput {
	title: string;
	summary: string;
	description?: string;
	status: string;
	colorPalette: string;
	owner?: string;
	startDate?: string;
	dueDate?: string;
	tags: string[];
}

/** Creates `content/projects/{slug}.json` straight on the git host, same
 * direct-commit path as `createTask`. */
export async function createProject(input: NewProjectInput): Promise<string> {
	const token = requireToken();
	const slug = slugifyProjectTitle(input.title);
	const path = `content/projects/${slug}.json`;

	if (await fileExists(path, token)) {
		throw new ProjectSaveError(
			`A project file already exists at "${path}" — use a different title.`,
		);
	}

	const data: Record<string, unknown> = {
		title: input.title,
		summary: input.summary,
		status: input.status,
		colorPalette: input.colorPalette,
	};
	if (input.description) data.description = input.description;
	if (input.owner) data.owner = input.owner;
	if (input.startDate) data.startDate = input.startDate;
	if (input.dueDate) data.dueDate = input.dueDate;
	if (input.tags.length > 0) data.tags = input.tags;

	// Tab-indented to match the CMS's own JSON output (see any file under
	// content/projects/).
	const content = `${JSON.stringify(data, null, "\t")}\n`;
	await createFile(path, content, `Create project "${input.title}"`, token);
	return slug;
}
