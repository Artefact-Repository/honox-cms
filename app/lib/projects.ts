import type { ColorPalette } from "../components/ui/color-palette";
import { markdownToHtml, parseFrontmatter } from "../utils/markdown";
import { buildHaystack, type SearchIndexEntry } from "../utils/search";

// Projects content lives under content/projects/*.md, one file per entry —
// same markdown+frontmatter convention as app/lib/tasks.ts, but flat (no
// i18n: this is operational data, not translated marketing content).
const projectModules = (
	typeof import.meta.glob === "function"
		? import.meta.glob("/content/projects/*.md", {
				query: "?raw",
				import: "default",
			})
		: {}
) as Record<string, () => Promise<string>>;

export type ProjectStatus =
	| "Planning"
	| "Active"
	| "On Hold"
	| "Completed"
	| "Archived";

export const PROJECT_STATUSES: ProjectStatus[] = [
	"Planning",
	"Active",
	"On Hold",
	"Completed",
	"Archived",
];

export const PROJECT_STATUS_COLOR: Record<ProjectStatus, ColorPalette> = {
	Planning: "gray",
	Active: "blue",
	"On Hold": "amber",
	Completed: "green",
	Archived: "gray",
};

// Same options list as public/admin/config.yml's `colorPalette` select, for
// the "New Project" form's picker.
export const PROJECT_COLOR_PALETTES: ColorPalette[] = [
	"gray",
	"blue",
	"green",
	"red",
	"orange",
	"purple",
	"cyan",
	"amber",
];

export interface Project {
	slug: string;
	title: string;
	summary: string;
	description?: string;
	status: ProjectStatus;
	colorPalette: ColorPalette;
	owner?: string;
	startDate?: string;
	dueDate?: string;
	tags: string[];
}

/** `Project` plus the description rendered to HTML, for the detail page. */
export interface ProjectDetail extends Project {
	html: string;
}

function slugFromPath(path: string): string {
	const match = path.match(/^\/content\/projects\/([^/]+)\.md$/);
	if (!match) throw new Error(`Unexpected project content path: ${path}`);
	return match[1]!;
}

async function loadProject(path: string): Promise<Project> {
	const loader = projectModules[path]!;
	const raw = await loader();
	const { data, content } = parseFrontmatter(raw);
	const slug = slugFromPath(path);
	const description = content.trim();
	return {
		slug,
		title: (data.title as string) ?? slug,
		summary: (data.summary as string) ?? "",
		description: description || undefined,
		status: (data.status as ProjectStatus) ?? "Planning",
		colorPalette: (data.colorPalette as ColorPalette) ?? "gray",
		owner: data.owner as string | undefined,
		startDate: data.startDate as string | undefined,
		dueDate: data.dueDate as string | undefined,
		tags: (data.tags as string[]) ?? [],
	};
}

export async function listProjects(): Promise<Project[]> {
	const projects = await Promise.all(
		Object.keys(projectModules).map((path) => loadProject(path)),
	);
	projects.sort((a, b) => a.title.localeCompare(b.title));
	return projects;
}

export async function loadProjectBySlug(
	slug: string,
): Promise<ProjectDetail | undefined> {
	const path = `/content/projects/${slug}.md`;
	if (!projectModules[path]) return undefined;
	const project = await loadProject(path);
	return {
		...project,
		html: project.description ? markdownToHtml(project.description) : "",
	};
}

/** All project slugs, for ssgParams. */
export function listProjectSlugs(): string[] {
	return Object.keys(projectModules).map((path) => slugFromPath(path));
}

export function buildProjectSearchEntries(
	projects: Project[],
): SearchIndexEntry[] {
	return projects.map((project) => ({
		key: project.slug,
		href: `/projects/${project.slug}`,
		title: project.title,
		description: project.summary,
		tags: project.tags,
		haystack: buildHaystack([
			project.title,
			project.summary,
			project.status,
			project.owner,
			project.tags,
		]),
	}));
}
