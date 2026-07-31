// Named escape hatches for a `table` block's `customRenderer` field (see
// page-registry.tsx's `table` renderer and app/lib/data-sources.ts's
// `resolveCustomTableData`) — for a table whose row rendering (drag-and-drop
// reorder, collapsible subtask tree, hover actions that open islands/a
// details drawer) is too bespoke for the generic columns/rows JSON path.
// Each component here is plain and synchronous: all its data arrives
// pre-resolved as props (the `data` bag attached by loadPage), so it fits
// page-registry's synchronous render pipeline without needing its own fetch.
import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { ChevronUpIcon } from "../icons/chevron-up";
import { EllipsisIcon } from "../icons/ellipsis";
import TaskCloneAction from "../islands/task-clone-action";
import TaskDeleteConfirm from "../islands/task-delete-confirm";
import TaskDetailsDrawer from "../islands/task-details-drawer";
import TaskEditAction from "../islands/task-edit-action";
import TaskPagination from "../islands/task-pagination";
import TaskRowActionsMenu from "../islands/task-row-actions-menu";
import TaskTreeDnd from "../islands/task-tree-dnd";
import TaskTreeToggle from "../islands/task-tree-toggle";
import type { Project } from "../lib/projects";
import {
	TASK_PRIORITIES,
	TASK_PRIORITY_COLOR,
	TASK_STATUS_COLOR,
	TASK_STATUSES,
	TASKS_PAGE_SIZE,
	type Task,
	type TaskPriority,
	type TaskStatus,
	type TaskTreeEntry,
} from "../lib/tasks";
import { formatDate } from "../utils/date";
import { Anchor, Avatar, Badge, DisplayValue, Stack, Table, Text } from "./ui";
import type { ColorPalette } from "./ui/color-palette";
import { colorPaletteClass } from "./ui/color-palette";

const treeRowClass = css({
	'&[data-tree-hidden="true"]': { display: "none" },
	'&[data-status-hidden="true"]': { display: "none" },
	'&[data-page-hidden="true"]': { display: "none" },
});

const treeToggleClass = css({
	all: "unset",
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	width: "5",
	height: "5",
	flexShrink: "0",
	cursor: "pointer",
	color: "fg.muted",
	"& [data-part=chevron]": {
		transition: "transform 0.15s",
		transform: "rotate(180deg)",
	},
	'&[data-expanded="false"] [data-part=chevron]': {
		transform: "rotate(90deg)",
	},
});

const dragHandleClass = css({
	flexShrink: "0",
	color: "fg.subtle",
	fontSize: "sm",
	lineHeight: "1",
	cursor: "grab",
});

interface TasksTableData {
	tasks: Task[];
	/** Each entry carries a 0-indexed `rootIndex` — see `computeTaskTreePages`
	 * in app/lib/tasks.ts — that TaskPagination reads off the rendered
	 * `<tr>`'s `data-root-index` to chunk rows into pages entirely
	 * client-side, including re-chunking around whatever a status/priority/
	 * assignee filter currently hides. */
	taskTree: (TaskTreeEntry & { rootIndex: number })[];
	projectBySlug: Record<string, Project>;
	projectTitleBySlug: Record<string, string>;
	matchedSlugs: string[];
	projectItems: { label: string; value: string }[];
	taskItems: { label: string; value: string }[];
	/** Merged configs.json `pms.statusColors`/`priorityColors` overrides on
	 * top of TASK_STATUS_COLOR/TASK_PRIORITY_COLOR — see data-sources.ts's
	 * `tasks` resolver. */
	statusColors: Record<TaskStatus, ColorPalette>;
	priorityColors: Record<TaskPriority, ColorPalette>;
	subtasksExpandedByDefault: boolean;
	totalPages: number;
	totalRootCount: number;
	pageSize: number;
}

function TasksTable(data: Partial<TasksTableData>) {
	const tasks = data.tasks ?? [];
	const taskTree = data.taskTree ?? [];
	const projectBySlug = data.projectBySlug ?? {};
	const projectTitleBySlug = data.projectTitleBySlug ?? {};
	const matchedSlugs = new Set(data.matchedSlugs ?? []);
	const projectItems = data.projectItems ?? [];
	const taskItems = data.taskItems ?? [];
	const statusColor = data.statusColors ?? TASK_STATUS_COLOR;
	const priorityColor = data.priorityColors ?? TASK_PRIORITY_COLOR;
	const subtasksExpandedByDefault = data.subtasksExpandedByDefault ?? true;
	const initialExpanded = subtasksExpandedByDefault ? "true" : "false";
	const totalPages = data.totalPages ?? 1;
	const pageSize = data.pageSize ?? TASKS_PAGE_SIZE;

	if (tasks.length === 0) {
		return <Text class={css({ color: "fg.muted" })}>No tasks yet.</Text>;
	}

	return (
		<>
			{/* Empty state — visibility toggled by the Search island */}
			<div
				id="tasks-search-empty"
				hidden={matchedSlugs.size !== 0}
				class={css({ textAlign: "center", py: "16", px: "4" })}
			>
				<Text class={css({ color: "fg.muted" })}>
					No tasks match your search.
				</Text>
			</div>
			<TaskTreeDnd>
				<Table
					getRowProps={(task: Task, rowIndex: number) => {
						const entry = taskTree[rowIndex];
						const depth = entry?.depth ?? 0;
						// Every ancestor toggle starts at `initialExpanded`, so when
						// subtasks are collapsed by default every descendant row is
						// transitively hidden on first render — same end state
						// TaskTreeToggle's recomputeVisibility would produce after
						// closing every toggle, just computed once for SSR instead of
						// walking the (not-yet-interactive) DOM.
						const initiallyHidden = !subtasksExpandedByDefault && depth > 0;
						return {
							id: `task-${task.slug}`,
							"data-task-slug": task.slug,
							"data-task-title": task.title,
							"data-task-status": task.status,
							"data-task-priority": task.priority,
							"data-task-assignee": task.assignee || "",
							"data-order-key": entry?.orderKey ?? 0,
							"data-depth": depth,
							"data-root-index": entry?.rootIndex ?? 0,
							...(entry && depth > 0
								? { "data-parent-slug": task.parentTask }
								: {}),
							...(initiallyHidden ? { "data-tree-hidden": "true" } : {}),
							draggable: true,
							hidden: !matchedSlugs.has(task.slug) || initiallyHidden,
							class: treeRowClass,
						};
					}}
					variant="surface"
					striped
					columns={[
						{
							header: "Task",
							key: "title",
							class: css({ maxWidth: "xs" }),
							render: (task: Task, rowIndex: number) => {
								const entry = taskTree[rowIndex];
								const depth = entry?.depth ?? 0;
								const hasChildren = entry?.hasChildren ?? false;
								return (
									<div
										style={{ paddingLeft: `${depth * 20}px` }}
										class={css({
											display: "flex",
											alignItems: "center",
											gap: "1",
											overflow: "hidden",
										})}
									>
										<span aria-hidden="true" class={dragHandleClass}>
											⠿
										</span>
										{hasChildren ? (
											<button
												type="button"
												data-subtask-toggle
												data-task-slug={task.slug}
												data-expanded={initialExpanded}
												aria-expanded={initialExpanded}
												aria-label={`Toggle subtasks of "${task.title}"`}
												class={treeToggleClass}
											>
												<ChevronUpIcon
													width="12"
													height="12"
													data-part="chevron"
												/>
											</button>
										) : (
											depth > 0 && (
												<span
													aria-hidden="true"
													class={css({
														width: "5",
														flexShrink: "0",
														color: "fg.muted",
														fontSize: "sm",
													})}
												>
													↳
												</span>
											)
										)}
										<Anchor
											href={`/tasks/${task.slug}`}
											variant="plain"
											data-task-details-trigger
											data-task-slug={task.slug}
											class={css({
												display: "block",
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											})}
										>
											{task.title}
										</Anchor>
									</div>
								);
							},
						},
						{
							header: "Project",
							key: "project",
							render: (task: Task) => {
								const project = projectBySlug[task.project];
								return project ? (
									<Anchor href={`/projects/${project.slug}`} variant="plain">
										{project.title}
									</Anchor>
								) : (
									<Text size="sm" class={css({ color: "fg.muted" })}>
										—
									</Text>
								);
							},
						},
						{
							header: "Status",
							key: "status",
							sortable: true,
							sortValue: (task: Task) => TASK_STATUSES.indexOf(task.status),
							render: (task: Task) => (
								<Anchor
									href={`/tasks/by-status/${encodeURIComponent(task.status)}`}
									variant="plain"
									class={css({ textDecoration: "none" })}
								>
									<Badge
										variant="subtle"
										size="sm"
										colorPalette={statusColor[task.status]}
									>
										{task.status}
									</Badge>
								</Anchor>
							),
						},
						{
							header: "Priority",
							key: "priority",
							sortable: true,
							sortValue: (task: Task) => TASK_PRIORITIES.indexOf(task.priority),
							render: (task: Task) => (
								<Anchor
									href={`/tasks/by-priority/${task.priority}`}
									variant="plain"
									class={css({ textDecoration: "none" })}
								>
									<Badge
										variant="subtle"
										size="sm"
										colorPalette={priorityColor[task.priority]}
									>
										{task.priority}
									</Badge>
								</Anchor>
							),
						},
						{
							header: "Assignee",
							key: "assignee",
							render: (task: Task) =>
								task.assignee ? (
									<Anchor
										href={`/tasks/by-assignee/${encodeURIComponent(task.assignee)}`}
										variant="plain"
										class={css({ textDecoration: "none" })}
									>
										<Stack gap="2" align="center">
											<Avatar size="xs" name={task.assignee} />
											<Text size="sm">{task.assignee}</Text>
										</Stack>
									</Anchor>
								) : (
									<Text size="sm" class={css({ color: "fg.muted" })}>
										—
									</Text>
								),
						},
						{
							header: "Due",
							key: "dueDate",
							sortable: true,
							render: (task: Task) => (
								<Text size="sm" class={css({ color: "fg.muted" })}>
									<DisplayValue value={task.dueDate} formatValue={formatDate} />
								</Text>
							),
						},
					]}
					rows={taskTree.map((entry) => entry.task)}
					hoverActions={(task: Task) => (
						<>
							<button
								type="button"
								data-task-edit-trigger
								data-task-slug={task.slug}
								aria-label={`Edit "${task.title}"`}
								class={cx(
									button({ variant: "outline", size: "sm" }),
									css({ textStyle: "sm", fontWeight: "medium" }),
								)}
							>
								Edit
							</button>
							<button
								type="button"
								data-task-clone-trigger
								data-task-slug={task.slug}
								aria-label={`Clone "${task.title}"`}
								class={cx(
									button({ variant: "outline", size: "sm" }),
									css({ textStyle: "sm", fontWeight: "medium" }),
								)}
							>
								Clone
							</button>
							<button
								type="button"
								data-task-delete-trigger
								data-task-slug={task.slug}
								aria-label={`Delete "${task.title}"`}
								class={cx(
									button({ variant: "outline", size: "sm" }),
									colorPaletteClass("red"),
									css({ textStyle: "sm", fontWeight: "medium" }),
								)}
							>
								Delete
							</button>
							<button
								type="button"
								data-task-row-actions-trigger
								data-task-slug={task.slug}
								aria-label={`More actions for "${task.title}"`}
								class={cx(
									button({ variant: "outline", size: "sm" }),
									css({ px: "1.5" }),
								)}
							>
								<EllipsisIcon width="16" height="16" />
							</button>
						</>
					)}
				/>
			</TaskTreeDnd>
			<TaskPagination totalPages={totalPages} pageSize={pageSize} />
			<TaskDetailsDrawer
				tasks={tasks}
				projectTitleBySlug={projectTitleBySlug}
				statusColors={statusColor}
				priorityColors={priorityColor}
			/>
			<TaskDeleteConfirm tasks={tasks} />
			<TaskCloneAction tasks={tasks} />
			<TaskEditAction
				tasks={tasks}
				projects={projectItems}
				taskItems={taskItems}
			/>
			<TaskRowActionsMenu tasks={tasks} />
			<TaskTreeToggle />
		</>
	);
}

export const customTableRenderers: Record<
	string,
	(data: Record<string, unknown>) => JSX.Element
> = {
	tasks: (data) => <TasksTable {...(data as Partial<TasksTableData>)} />,
};
