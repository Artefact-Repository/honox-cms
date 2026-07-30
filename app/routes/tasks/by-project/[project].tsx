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
import { listProjects, loadProjectBySlug } from "../../../lib/projects";
import {
	buildTaskSearchEntries,
	listTasksByProject,
	TASK_PRIORITIES,
	TASK_PRIORITY_COLOR,
	TASK_STATUS_COLOR,
	TASK_STATUSES,
	type Task,
} from "../../../lib/tasks";
import { mergeColorOverrides } from "../../../lib/pms-config";
import { formatDate } from "../../../utils/date";
import { filterEntries } from "../../../utils/search";

export default createRoute(
	ssgParams(async () => {
		const projects = await listProjects();
		return projects.map((project) => ({ project: project.slug }));
	}),

	async (c) => {
		const projectSlug = c.req.param("project");
		const [project, allProjects, config] = await Promise.all([
			loadProjectBySlug(projectSlug),
			listProjects(),
			loadDocsConfig("en"),
		]);
		if (!project) return c.notFound();

		const statusColor = mergeColorOverrides(
			TASK_STATUS_COLOR,
			config.pms?.statusColors,
			"status",
		);
		const priorityColor = mergeColorOverrides(
			TASK_PRIORITY_COLOR,
			config.pms?.priorityColors,
			"priority",
		);

		const tasks = await listTasksByProject(projectSlug);

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
				<title>{project.title} Tasks - Artefact</title>

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
									action={`/tasks/by-project/${projectSlug}`}
									initialQuery={searchQuery}
									placeholder="Search tasks..."
									itemLabel="tasks"
									total={tasks.length}
									filterAttribute="data-task-slug"
									emptyStateId="project-tasks-search-empty"
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

					<Heading as="h1" size="3xl" class={css({ mb: "2" })}>
						Tasks · {project.title}
					</Heading>
					<Text class={css({ color: "fg.muted", mb: "6" })}>
						{tasks.length} task{tasks.length !== 1 ? "s" : ""} in{" "}
						<Anchor href={`/projects/${project.slug}`} variant="plain">
							{project.title}
						</Anchor>
						, soonest due date first.
					</Text>

					{/* Project filter chips */}
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
								All Projects
							</Badge>
						</Anchor>
						{allProjects.map((p) => (
							<Anchor
								key={p.slug}
								href={`/tasks/by-project/${p.slug}`}
								variant="plain"
								class={css({ textDecoration: "none" })}
							>
								<Badge
									variant={p.slug === projectSlug ? "solid" : "subtle"}
									colorPalette={p.slug === projectSlug ? "blue" : "gray"}
									class={css({
										px: "4",
										py: "2",
										borderRadius: "full",
										fontSize: "sm",
									})}
								>
									{p.title}
								</Badge>
							</Anchor>
						))}
					</Stack>

					{tasks.length === 0 ? (
						<Text class={css({ color: "fg.muted" })}>
							No tasks in this project yet.
						</Text>
					) : (
						<>
							{/* Empty state — visibility toggled by the Search island */}
							<div
								id="project-tasks-search-empty"
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
													display: "block",
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												})}
											>
												{task.title}
											</Anchor>
										),
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
												<Text size="sm">{task.assignee}</Text>
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
