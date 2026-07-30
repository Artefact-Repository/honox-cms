// Named, server-side data sources a CMS content block can bind to via a
// `dataSource` (or, for a table's escape hatch, `customRenderer`) field —
// the page-builder equivalent of Ark UI's list-collection item conversion
// (https://ark-ui.com/docs/collections/list-collection): each resolver turns
// one app-specific data shape (projects, task statuses, ...) into the same
// uniform item shape a generic block (e.g. `badge-list`) can render without
// knowing where the data actually came from.
import { listProjects } from "./projects";
import {
	buildTaskSearchEntries,
	buildTaskTree,
	listTasks,
	TASK_PRIORITIES,
	TASK_PRIORITY_COLOR,
	TASK_STATUS_COLOR,
	TASK_STATUSES,
} from "./tasks";
import { filterEntries } from "../utils/search";

export interface DataSourceContext {
	/** Full request URL (path + query) — needed by any source whose contents
	 * depend on the current request, e.g. a search query string. Omitted for
	 * a static build (ssg) context. */
	currentUrl?: string;
}

export interface DataSourceItem {
	label: string;
	value: string;
	href?: string;
	colorPalette?: string;
}

type DataSourceResolver = (ctx: DataSourceContext) => Promise<DataSourceItem[]>;

const dataSources: Record<string, DataSourceResolver> = {
	projects: async () => {
		const projects = await listProjects();
		return projects.map((project) => ({
			label: project.title,
			value: project.slug,
			href: `/tasks/by-project/${project.slug}`,
		}));
	},

	taskAssignees: async () => {
		const tasks = await listTasks();
		const names = Array.from(
			new Set(tasks.map((task) => task.assignee).filter(Boolean) as string[]),
		).sort();
		return names.map((name) => ({
			label: name,
			value: name,
			href: `/tasks/by-assignee/${encodeURIComponent(name)}`,
		}));
	},

	taskStatuses: async () =>
		TASK_STATUSES.map((status) => ({
			label: status,
			value: status,
			href: `/tasks/by-status/${encodeURIComponent(status)}`,
			colorPalette: TASK_STATUS_COLOR[status],
		})),

	taskPriorities: async () =>
		TASK_PRIORITIES.map((priority) => ({
			label: priority,
			value: priority,
			href: `/tasks/by-priority/${priority}`,
			colorPalette: TASK_PRIORITY_COLOR[priority],
		})),
};

/** Resolves a named data source into a flat list of uniform items. Returns
 * an empty list for an unknown name rather than throwing, so a typo'd or
 * stale CMS reference degrades to "nothing renders" instead of a 500. */
export async function resolveDataSource(
	name: string,
	ctx: DataSourceContext = {},
): Promise<DataSourceItem[]> {
	const resolver = dataSources[name];
	if (!resolver) return [];
	return resolver(ctx);
}

// Named escape hatches for a `table` block whose row rendering is too
// bespoke (drag-and-drop reorder, collapsible subtask tree, hover actions
// that open islands/a details drawer) for the generic columns/rows path —
// see the `table` block type in page-registry.tsx and its matching
// `customTableRenderers` map in components/custom-table-renderers.tsx. Each
// resolver here fetches and shapes exactly the data its matching renderer
// component needs; the renderer itself stays a plain, synchronous,
// presentational component (no fetching of its own) so it fits page-registry's
// synchronous render pipeline — this resolver runs earlier, from `loadPage`.
type CustomTableDataResolver = (
	ctx: DataSourceContext,
) => Promise<Record<string, unknown>>;

const customTableDataResolvers: Record<string, CustomTableDataResolver> = {
	tasks: async (ctx) => {
		const [tasks, projects] = await Promise.all([
			listTasks(),
			listProjects(),
		]);
		const projectBySlug = new Map(projects.map((p) => [p.slug, p]));
		const projectTitleBySlug = new Map(
			projects.map((p) => [p.slug, p.title]),
		);
		const taskTree = buildTaskTree(tasks);

		// Server-side filtering for the no-JS ?q= fallback, mirroring the blog
		// listing page: all rows still render (non-matches hidden) so the Search
		// island can broaden results client-side without a round-trip.
		const searchQuery = ctx.currentUrl
			? (new URL(ctx.currentUrl).searchParams.get("q") ?? "")
			: "";
		const searchEntries = buildTaskSearchEntries(tasks, projectTitleBySlug);
		const matchedSlugs = filterEntries(searchEntries, searchQuery).map(
			(entry) => entry.key,
		);

		return {
			tasks,
			taskTree,
			projectBySlug: Object.fromEntries(projectBySlug),
			projectTitleBySlug: Object.fromEntries(projectTitleBySlug),
			matchedSlugs,
		};
	},
};

export async function resolveCustomTableData(
	name: string,
	ctx: DataSourceContext = {},
): Promise<Record<string, unknown> | undefined> {
	const resolver = customTableDataResolvers[name];
	if (!resolver) return undefined;
	return resolver(ctx);
}
