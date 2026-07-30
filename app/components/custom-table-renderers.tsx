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
import { Anchor, Avatar, Badge, DisplayValue, Stack, Table, Text } from "./ui";
import { colorPaletteClass } from "./ui/color-palette";
import { ChevronUpIcon } from "../icons/chevron-up";
import { EllipsisIcon } from "../icons/ellipsis";
import TaskCloneAction from "../islands/task-clone-action";
import TaskDeleteConfirm from "../islands/task-delete-confirm";
import TaskDetailsDrawer from "../islands/task-details-drawer";
import TaskEditAction from "../islands/task-edit-action";
import TaskRowActionsMenu from "../islands/task-row-actions-menu";
import TaskTreeDnd from "../islands/task-tree-dnd";
import TaskTreeToggle from "../islands/task-tree-toggle";
import type { Project } from "../lib/projects";
import {
	TASK_PRIORITIES,
	TASK_PRIORITY_COLOR,
	TASK_STATUS_COLOR,
	TASK_STATUSES,
	type Task,
	type TaskTreeEntry,
} from "../lib/tasks";
import { formatDate } from "../utils/date";

const treeRowClass = css({
	'&[data-tree-hidden="true"]': { display: "none" },
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
	taskTree: TaskTreeEntry[];
	projectBySlug: Record<string, Project>;
	projectTitleBySlug: Record<string, string>;
	matchedSlugs: string[];
	projectItems: { label: string; value: string }[];
	taskItems: { label: string; value: string }[];
}

function TasksTable(data: Partial<TasksTableData>) {
	const tasks = data.tasks ?? [];
	const taskTree = data.taskTree ?? [];
	const projectBySlug = data.projectBySlug ?? {};
	const projectTitleBySlug = data.projectTitleBySlug ?? {};
	const matchedSlugs = new Set(data.matchedSlugs ?? []);
	const projectItems = data.projectItems ?? [];
	const taskItems = data.taskItems ?? [];

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
						return {
							id: `task-${task.slug}`,
							"data-task-slug": task.slug,
							"data-task-title": task.title,
							"data-order-key": entry?.orderKey ?? 0,
							"data-depth": entry?.depth ?? 0,
							...(entry && entry.depth > 0
								? { "data-parent-slug": task.parentTask }
								: {}),
							draggable: true,
							hidden: !matchedSlugs.has(task.slug),
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
												data-expanded="true"
												aria-expanded="true"
												aria-label={`Toggle subtasks of "${task.title}"`}
												class={treeToggleClass}
											>
												<ChevronUpIcon width="12" height="12" data-part="chevron" />
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
										colorPalette={TASK_STATUS_COLOR[task.status]}
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
										colorPalette={TASK_PRIORITY_COLOR[task.priority]}
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
			<TaskDetailsDrawer tasks={tasks} projectTitleBySlug={projectTitleBySlug} />
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
