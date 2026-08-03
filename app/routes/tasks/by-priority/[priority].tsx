import { css } from "design-system/css";
import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import {
	Anchor,
	Badge,
	DisplayValue,
	Heading,
	Search,
	Stack,
	Table,
	Text,
} from "../../../components/ui";
import AuthStatus from "../../../islands/auth-status";
import { loadDocsConfig } from "../../../lib/configs";
import { mergeColorOverrides } from "../../../lib/pms-config";
import { listProjects, type Project } from "../../../lib/projects";
import {
	buildTaskSearchEntries,
	colorForTag,
	listTasks,
	splitTitleTag,
	TASK_PRIORITIES,
	TASK_PRIORITY_COLOR,
	TASK_STATUS_COLOR,
	TASK_STATUSES,
	type Task,
	type TaskPriority,
} from "../../../lib/tasks";
import { formatDate } from "../../../utils/date";
import { filterEntries } from "../../../utils/search";

export default createRoute(
	ssgParams(() => TASK_PRIORITIES.map((priority) => ({ priority }))),

	async (c) => {
		const priorityParam = c.req.param("priority") as TaskPriority;
		if (!TASK_PRIORITIES.includes(priorityParam)) return c.notFound();

		const [allTasks, projects, config] = await Promise.all([
			listTasks(),
			listProjects(),
			loadDocsConfig("en"),
		]);
		const projectBySlug = new Map<string, Project>(
			projects.map((project) => [project.slug, project]),
		);
		const statusColor = mergeColorOverrides(
			TASK_STATUS_COLOR,
			config.pms?.statusColors,
		);
		const priorityColor = mergeColorOverrides(
			TASK_PRIORITY_COLOR,
			config.pms?.priorityColors,
		);

		const tasks = allTasks.filter((task) => task.priority === priorityParam);

		// Server-side filtering for the no-JS ?q= fallback, same pattern as
		// /tasks and /projects/[slug].
		const searchQuery = new URL(c.req.url).searchParams.get("q") || "";
		const matchedSlugs = new Set(
			filterEntries(buildTaskSearchEntries(tasks), searchQuery).map(
				(entry) => entry.key,
			),
		);

		return c.render(
			<>
				<title>{priorityParam} Priority Tasks - Artefact</title>

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
							<div
								class={css({ flex: "1", maxWidth: "sm", minWidth: "160px" })}
							>
								<Search
									size="sm"
									src="/api/tasks/search.json"
									action={`/tasks/by-priority/${priorityParam}`}
									initialQuery={searchQuery}
									placeholder="Search tasks..."
									itemLabel="tasks"
									total={tasks.length}
									filterAttribute="data-task-slug"
									emptyStateId="priority-tasks-search-empty"
									showCount={false}
								/>
							</div>
						)}

						<nav
							class={css({ display: "flex", gap: "6", alignItems: "center" })}
						>
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
							<AuthStatus />
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
					<Anchor
						href="/tasks"
						variant="plain"
						class={css({
							textStyle: "sm",
							color: "fg.muted",
							mb: "3",
							display: "inline-block",
						})}
					>
						← All Tasks
					</Anchor>

					<Stack align="center" gap="3" class={css({ mb: "2" })}>
						<Heading as="h1" size="3xl">
							{priorityParam} Priority
						</Heading>
						<Badge variant="subtle" colorPalette={priorityColor[priorityParam]}>
							{tasks.length}
						</Badge>
					</Stack>
					<Text class={css({ color: "fg.muted", mb: "6" })}>
						{tasks.length} {priorityParam.toLowerCase()}-priority task
						{tasks.length !== 1 ? "s" : ""}, soonest due date first.
					</Text>

					{/* Priority filter chips */}
					<Stack gap="3" align="center" wrap="wrap" class={css({ mb: "8" })}>
						<Anchor
							href="/tasks"
							variant="plain"
							class={css({ textDecoration: "none" })}
						>
							<Badge
								variant="subtle"
								colorPalette="gray"
								class={css({
									px: "4",
									py: "2",
									borderRadius: "full",
									fontSize: "sm",
								})}
							>
								All Priorities
							</Badge>
						</Anchor>
						{TASK_PRIORITIES.map((priority) => (
							<Anchor
								key={priority}
								href={`/tasks/by-priority/${priority}`}
								variant="plain"
								class={css({ textDecoration: "none" })}
							>
								<Badge
									variant={priority === priorityParam ? "solid" : "subtle"}
									colorPalette={priorityColor[priority]}
									class={css({
										px: "4",
										py: "2",
										borderRadius: "full",
										fontSize: "sm",
									})}
								>
									{priority}
								</Badge>
							</Anchor>
						))}
					</Stack>

					{tasks.length === 0 ? (
						<Text class={css({ color: "fg.muted" })}>
							No {priorityParam.toLowerCase()}-priority tasks.
						</Text>
					) : (
						<>
							{/* Empty state — visibility toggled by the Search island */}
							<div
								id="priority-tasks-search-empty"
								hidden={matchedSlugs.size !== 0}
								class={css({ textAlign: "center", py: "16", px: "4" })}
							>
								<Text class={css({ color: "fg.muted" })}>
									No tasks match your search.
								</Text>
							</div>
							<Table
								getRowProps={(task: Task) => ({
									id: `task-${task.slug}`,
									"data-task-slug": task.slug,
									hidden: !matchedSlugs.has(task.slug),
								})}
								variant="surface"
								striped
								columns={[
									{
										header: "Task",
										key: "title",
										class: css({ maxWidth: "sm" }),
										render: (task: Task) => (
											<Anchor
												href={`/tasks/${task.slug}`}
												variant="plain"
												class={css({
													display: "inline-flex",
													alignItems: "center",
													gap: "1.5",
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												})}
											>
												{(() => {
													const { tag, rest } = splitTitleTag(task.title);
													if (tag) {
														return (
															<>
																<Badge
																	variant="subtle"
																	size="sm"
																	colorPalette={colorForTag(tag)}
																	class={css({ flexShrink: "0" })}
																>
																	{tag}
																</Badge>
																<span>{rest}</span>
															</>
														);
													}
													return task.title;
												})()}
											</Anchor>
										),
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
													colorPalette={statusColor[task.status]}
												>
													{task.status}
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
												>
													{task.assignee}
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
												<DisplayValue
													value={task.dueDate}
													formatValue={formatDate}
												/>
											</Text>
										),
									},
								]}
								rows={tasks}
							/>
						</>
					)}
				</div>
			</>,
		);
	},
);
