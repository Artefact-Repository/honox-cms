import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { createRoute } from "honox/factory";
import {
	Anchor,
	Avatar,
	Badge,
	Heading,
	Search,
	Stack,
	Table,
	Text,
} from "../../components/ui";
import { colorPaletteClass } from "../../components/ui/color-palette";
import { Toaster } from "../../components/ui/toast";
import { ChevronUpIcon } from "../../icons/chevron-up";
import { EllipsisIcon } from "../../icons/ellipsis";
import PmsCreateMenu from "../../islands/pms-create-menu";
import TaskCloneAction from "../../islands/task-clone-action";
import TaskDeleteConfirm from "../../islands/task-delete-confirm";
import TaskDetailsDrawer from "../../islands/task-details-drawer";
import TaskRowActionsMenu from "../../islands/task-row-actions-menu";
import TaskTreeDnd from "../../islands/task-tree-dnd";
import TaskTreeToggle from "../../islands/task-tree-toggle";
import { listProjects, type Project } from "../../lib/projects";
import {
	buildTaskSearchEntries,
	buildTaskTree,
	listTasks,
	TASK_PRIORITIES,
	TASK_PRIORITY_COLOR,
	TASK_STATUS_COLOR,
	TASK_STATUSES,
	type Task,
} from "../../lib/tasks";
import { filterEntries } from "../../utils/search";

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

function formatDate(value?: string) {
	if (!value) return undefined;
	return new Date(value).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export default createRoute(async (c) => {
	const [tasks, projects] = await Promise.all([listTasks(), listProjects()]);
	const projectBySlug = new Map<string, Project>(
		projects.map((project) => [project.slug, project]),
	);
	const projectTitleBySlug = new Map(
		projects.map((project) => [project.slug, project.title]),
	);
	const projectItems = projects.map((project) => ({
		label: project.title,
		value: project.slug,
	}));
	const taskItems = tasks.map((task) => ({
		label: task.title,
		value: task.slug,
	}));
	// Groups subtasks directly under their parent (indented, collapsible via
	// TaskTreeToggle) instead of the flat due-date order `tasks` is already
	// sorted in — `taskTree[rowIndex]` below lines up with `rows={...}`
	// since both are derived from this same array.
	const taskTree = buildTaskTree(tasks);
	const assignees = Array.from(
		new Set(tasks.map((task) => task.assignee).filter(Boolean) as string[]),
	).sort();

	// Server-side filtering for the no-JS ?q= fallback, mirroring the blog
	// listing page: all rows still render (non-matches hidden) so the Search
	// island can broaden results client-side without a round-trip.
	const searchQuery = new URL(c.req.url).searchParams.get("q") || "";
	const searchEntries = buildTaskSearchEntries(tasks, projectTitleBySlug);
	const matchedSlugs = new Set(
		filterEntries(searchEntries, searchQuery).map((entry) => entry.key),
	);

	return c.render(
		<>
			<title>Tasks - Artefact</title>
			<Toaster />

			<header
				class={css({
					borderBottomWidth: "1px",
					borderColor: { _light: "white.a4", _dark: "black.a4" },
					bg: { _light: "white.a7", _dark: "black.a7" },
					backdropFilter: "blur(20px) saturate(180%)",
					position: "sticky",
					top: "0",
					zIndex: "10",
				})}
			>
				<div
					class={css({
						maxWidth: "7xl",
						mx: "auto",
						px: { base: "4", md: "6", lg: "8" },
						py: "4",
						display: "flex",
						flexWrap: "wrap",
						rowGap: "3",
						alignItems: "center",
						justifyContent: "space-between",
						gap: "4",
					})}
				>
					<Anchor
						href="/"
						variant="plain"
						class={css({ textDecoration: "none", flexShrink: "0" })}
					>
						<Heading
							as="span"
							class={css({
								fontSize: "lg",
								fontWeight: "bold",
								tracking: "tight",
							})}
						>
							Artefact UI
						</Heading>
					</Anchor>

					{tasks.length > 0 && (
						<div class={css({ flex: "1", maxWidth: "sm", minWidth: "160px" })}>
							<Search
								size="sm"
								src="/api/tasks/search.json"
								action="/tasks"
								initialQuery={searchQuery}
								placeholder="Search tasks..."
								itemLabel="tasks"
								total={tasks.length}
								filterAttribute="data-task-slug"
								emptyStateId="tasks-search-empty"
								showCount={false}
							/>
						</div>
					)}

					<nav class={css({ display: "flex", gap: "6", alignItems: "center" })}>
						<Anchor
							href="/projects"
							variant="plain"
							class={css({
								textStyle: "sm",
								fontWeight: "medium",
								color: "fg.muted",
								textDecoration: "none",
								_hover: { color: "fg" },
							})}
						>
							Projects
						</Anchor>
						<Anchor
							href="/tasks"
							variant="plain"
							class={css({
								textStyle: "sm",
								fontWeight: "semibold",
								color: "fg",
								textDecoration: "none",
							})}
						>
							Tasks
						</Anchor>
						<PmsCreateMenu projects={projectItems} tasks={taskItems} />
						<Anchor
							href="/admin"
							class={cx(
								button({ variant: "outline", size: "sm" }),
								css({ textStyle: "sm", fontWeight: "medium" }),
							)}
						>
							Admin
						</Anchor>
					</nav>
				</div>
			</header>

			<div
				class={css({
					py: { base: "8", md: "12" },
					px: { base: "4", md: "6", lg: "8" },
					maxWidth: "7xl",
					mx: "auto",
				})}
			>
				<Heading as="h1" size="3xl" class={css({ mb: "2" })}>
					Tasks
				</Heading>
				<Text class={css({ color: "fg.muted", mb: "6" })}>
					Every task across every project, soonest due date first.
				</Text>

				{projects.length > 0 && (
					<Stack gap="2" align="center" wrap="wrap" class={css({ mb: "3" })}>
						<Text
							size="xs"
							class={css({
								fontWeight: "semibold",
								textTransform: "uppercase",
								letterSpacing: "wide",
								color: "fg.muted",
							})}
						>
							Project
						</Text>
						{projects.map((project) => (
							<Anchor
								key={project.slug}
								href={`/tasks/by-project/${project.slug}`}
								variant="plain"
								class={css({ textDecoration: "none" })}
							>
								<Badge
									variant="subtle"
									colorPalette="gray"
									class={css({
										px: "3",
										py: "1",
										borderRadius: "full",
										fontSize: "xs",
									})}
								>
									{project.title}
								</Badge>
							</Anchor>
						))}
					</Stack>
				)}

				{assignees.length > 0 && (
					<Stack gap="2" align="center" wrap="wrap" class={css({ mb: "3" })}>
						<Text
							size="xs"
							class={css({
								fontWeight: "semibold",
								textTransform: "uppercase",
								letterSpacing: "wide",
								color: "fg.muted",
							})}
						>
							Assignee
						</Text>
						{assignees.map((name) => (
							<Anchor
								key={name}
								href={`/tasks/by-assignee/${encodeURIComponent(name)}`}
								variant="plain"
								class={css({ textDecoration: "none" })}
							>
								<Badge
									variant="subtle"
									colorPalette="gray"
									class={css({
										px: "3",
										py: "1",
										borderRadius: "full",
										fontSize: "xs",
									})}
								>
									{name}
								</Badge>
							</Anchor>
						))}
					</Stack>
				)}

				<Stack gap="2" align="center" wrap="wrap" class={css({ mb: "3" })}>
					<Text
						size="xs"
						class={css({
							fontWeight: "semibold",
							textTransform: "uppercase",
							letterSpacing: "wide",
							color: "fg.muted",
						})}
					>
						Status
					</Text>
					{TASK_STATUSES.map((status) => (
						<Anchor
							key={status}
							href={`/tasks/by-status/${encodeURIComponent(status)}`}
							variant="plain"
							class={css({ textDecoration: "none" })}
						>
							<Badge
								variant="subtle"
								colorPalette={TASK_STATUS_COLOR[status]}
								class={css({
									px: "3",
									py: "1",
									borderRadius: "full",
									fontSize: "xs",
								})}
							>
								{status}
							</Badge>
						</Anchor>
					))}
				</Stack>

				<Stack gap="2" align="center" wrap="wrap" class={css({ mb: "8" })}>
					<Text
						size="xs"
						class={css({
							fontWeight: "semibold",
							textTransform: "uppercase",
							letterSpacing: "wide",
							color: "fg.muted",
						})}
					>
						Priority
					</Text>
					{TASK_PRIORITIES.map((priority) => (
						<Anchor
							key={priority}
							href={`/tasks/by-priority/${priority}`}
							variant="plain"
							class={css({ textDecoration: "none" })}
						>
							<Badge
								variant="subtle"
								colorPalette={TASK_PRIORITY_COLOR[priority]}
								class={css({
									px: "3",
									py: "1",
									borderRadius: "full",
									fontSize: "xs",
								})}
							>
								{priority}
							</Badge>
						</Anchor>
					))}
				</Stack>

				{tasks.length === 0 ? (
					<Text class={css({ color: "fg.muted" })}>No tasks yet.</Text>
				) : (
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
											const project = projectBySlug.get(task.project);
											return project ? (
												<Anchor
													href={`/projects/${project.slug}`}
													variant="plain"
												>
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
										sortValue: (task: Task) =>
											TASK_STATUSES.indexOf(task.status),
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
										sortValue: (task: Task) =>
											TASK_PRIORITIES.indexOf(task.priority),
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
												{formatDate(task.dueDate) ?? "—"}
											</Text>
										),
									},
								]}
								rows={taskTree.map((entry) => entry.task)}
								hoverActions={(task: Task) => (
									<>
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
						<TaskDetailsDrawer
							tasks={tasks}
							projectTitleBySlug={Object.fromEntries(projectTitleBySlug)}
						/>
						<TaskDeleteConfirm tasks={tasks} />
						<TaskCloneAction tasks={tasks} />
						<TaskRowActionsMenu tasks={tasks} />
						<TaskTreeToggle />
					</>
				)}
			</div>
		</>,
	);
});
