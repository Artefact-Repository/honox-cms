// Named, server-side data sources a CMS content block can bind to via a
// `dataSource` (or, for a table's escape hatch, `customRenderer`) field —
// the page-builder equivalent of Ark UI's list-collection item conversion
// (https://ark-ui.com/docs/collections/list-collection): each resolver turns
// one app-specific data shape (projects, task statuses, ...) into the same
// uniform item shape a generic block (e.g. `badge-list`) can render without
// knowing where the data actually came from.

import { filterEntries } from "../utils/search";
import { loadDocsConfig } from "./configs";
import { mergeColorOverrides } from "./pms-config";
import { listProjects } from "./projects";
import {
	buildTaskSearchEntries,
	buildTaskTree,
	computeTaskTreePages,
	listTasks,
	TASK_PRIORITIES,
	TASK_PRIORITY_COLOR,
	TASK_STATUS_COLOR,
	TASK_STATUSES,
	TASKS_PAGE_SIZE,
} from "./tasks";

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

	taskStatuses: async () => {
		const config = await loadDocsConfig("en");
		const statusColor = mergeColorOverrides(
			TASK_STATUS_COLOR,
			config.pms?.statusColors,
		);
		return TASK_STATUSES.map((status) => ({
			label: status,
			value: status,
			href: `/tasks/by-status/${encodeURIComponent(status)}`,
			colorPalette: statusColor[status],
		}));
	},

	taskPriorities: async () => {
		const config = await loadDocsConfig("en");
		const priorityColor = mergeColorOverrides(
			TASK_PRIORITY_COLOR,
			config.pms?.priorityColors,
		);
		return TASK_PRIORITIES.map((priority) => ({
			label: priority,
			value: priority,
			href: `/tasks/by-priority/${priority}`,
			colorPalette: priorityColor[priority],
		}));
	},
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
		const [tasks, projects, config] = await Promise.all([
			listTasks(),
			listProjects(),
			loadDocsConfig("en"),
		]);
		const projectBySlug = new Map(projects.map((p) => [p.slug, p]));
		const projectTitleBySlug = new Map(projects.map((p) => [p.slug, p.title]));
		const taskTree = buildTaskTree(tasks);
		const statusColors = mergeColorOverrides(
			TASK_STATUS_COLOR,
			config.pms?.statusColors,
		);
		const priorityColors = mergeColorOverrides(
			TASK_PRIORITY_COLOR,
			config.pms?.priorityColors,
		);
		const subtasksExpandedByDefault =
			config.pms?.subtasksExpandedByDefault ?? true;

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

		// This site is a static (SSG) build — there's no per-request server to
		// read a `?page=` query param at render time (see wrangler.jsonc: an
		// assets-only deploy, no Worker), so every row renders here regardless
		// of page, and `app/islands/task-pagination.tsx` toggles which page's
		// rows are visible client-side — same reasoning as the Search island's
		// `?q=` handling. This just stamps each row with which root-subtree
		// group it belongs to, so that island can chunk pages (and re-chunk
		// them around whatever a status/priority/assignee filter hides).
		const { rootIndexByIndex, totalPages, totalRootCount } =
			computeTaskTreePages(taskTree, TASKS_PAGE_SIZE);
		const pagedTaskTree = taskTree.map((entry, index) => ({
			...entry,
			rootIndex: rootIndexByIndex[index],
		}));

		return {
			tasks,
			taskTree: pagedTaskTree,
			projectBySlug: Object.fromEntries(projectBySlug),
			projectTitleBySlug: Object.fromEntries(projectTitleBySlug),
			matchedSlugs,
			// Combobox items for the row-level Edit drawer (see TaskEditAction) —
			// same {label, value} shape PmsCreateMenu already passes into
			// TaskCreateDrawer for its Project/Parent task fields.
			projectItems: projects.map((p) => ({ label: p.title, value: p.slug })),
			taskItems: tasks.map((t) => ({ label: t.title, value: t.slug })),
			statusColors,
			priorityColors,
			subtasksExpandedByDefault,
			totalPages,
			totalRootCount,
			pageSize: TASKS_PAGE_SIZE,
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
