import type { ColorPalette } from "../components/ui/color-palette";

// Projects content lives under content/projects/*.json, one file per entry —
// same glob-by-filename convention as app/lib/pages.ts, but flat (no i18n:
// this is operational data, not translated marketing content).
const projectModules = import.meta.glob("/content/projects/*.json", {
	import: "default",
}) as Record<string, () => Promise<unknown>>;

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

function slugFromPath(path: string): string {
	const match = path.match(/^\/content\/projects\/([^/]+)\.json$/);
	if (!match) throw new Error(`Unexpected project content path: ${path}`);
	return match[1]!;
}

async function loadProject(path: string): Promise<Project> {
	const loader = projectModules[path]!;
	const data = (await loader()) as Partial<Project>;
	return {
		slug: slugFromPath(path),
		title: data.title ?? slugFromPath(path),
		summary: data.summary ?? "",
		description: data.description,
		status: (data.status as ProjectStatus) ?? "Planning",
		colorPalette: (data.colorPalette as ColorPalette) ?? "gray",
		owner: data.owner,
		startDate: data.startDate,
		dueDate: data.dueDate,
		tags: data.tags ?? [],
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
): Promise<Project | undefined> {
	const path = `/content/projects/${slug}.json`;
	if (!projectModules[path]) return undefined;
	return loadProject(path);
}

/** All project slugs, for ssgParams. */
export function listProjectSlugs(): string[] {
	return Object.keys(projectModules).map((path) => slugFromPath(path));
}
