import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { ssgParams } from "hono/ssg";
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
} from "../../../components/ui";
import { listProjects, type Project } from "../../../lib/projects";
import {
	buildTaskSearchEntries,
	listTasks,
	TASK_PRIORITIES,
	TASK_PRIORITY_COLOR,
	TASK_STATUS_COLOR,
	TASK_STATUSES,
	type Task,
} from "../../../lib/tasks";
import { filterEntries } from "../../../utils/search";

function formatDate(value?: string) {
	if (!value) return undefined;
	return new Date(value).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export default createRoute(
	ssgParams(async () => {
		const tasks = await listTasks();
		const assignees = new Set<string>();
		for (const task of tasks) {
			if (task.assignee) assignees.add(task.assignee);
		}
		return Array.from(assignees).map((assignee) => ({ assignee }));
	}),

	async (c) => {
		const assigneeParam = decodeURIComponent(c.req.param("assignee") ?? "");
		const [allTasks, projects] = await Promise.all([
			listTasks(),
			listProjects(),
		]);
		const projectBySlug = new Map<string, Project>(
			projects.map((project) => [project.slug, project]),
		);

		const tasks = allTasks.filter(
			(task) =>
				(task.assignee ?? "").toLowerCase() === assigneeParam.toLowerCase(),
		);
		if (tasks.length === 0) {
			// Unknown assignee (not just "assigned nothing yet") — 404 rather than
			// silently rendering an empty archive for an arbitrary URL segment.
			const knownAssignees = new Set(
				allTasks.map((task) => task.assignee).filter(Boolean),
			);
			if (!knownAssignees.has(assigneeParam)) return c.notFound();
		}

		const assigneeName = tasks[0]?.assignee || assigneeParam;
		const allAssignees = Array.from(
			new Set(
				allTasks.map((task) => task.assignee).filter(Boolean) as string[],
			),
		).sort();

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
				<title>{assigneeName} Tasks - Artefact</title>

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
									action={`/tasks/by-assignee/${encodeURIComponent(assigneeParam)}`}
									initialQuery={searchQuery}
									placeholder="Search tasks..."
									itemLabel="tasks"
									total={tasks.length}
									filterAttribute="data-task-slug"
									emptyStateId="assignee-tasks-search-empty"
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
						<Avatar size="sm" name={assigneeName} />
						<Heading as="h1" size="3xl">
							{assigneeName}
						</Heading>
					</Stack>
					<Text class={css({ color: "fg.muted", mb: "6" })}>
						{tasks.length} task{tasks.length !== 1 ? "s" : ""} assigned, soonest
						due date first.
					</Text>

					{/* Assignee filter chips */}
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
								All Assignees
							</Badge>
						</Anchor>
						{allAssignees.map((name) => (
							<Anchor
								key={name}
								href={`/tasks/by-assignee/${encodeURIComponent(name)}`}
								variant="plain"
								class={css({ textDecoration: "none" })}
							>
								<Badge
									variant={name === assigneeName ? "solid" : "subtle"}
									colorPalette={name === assigneeName ? "blue" : "gray"}
									class={css({
										px: "4",
										py: "2",
										borderRadius: "full",
										fontSize: "sm",
									})}
								>
									{name}
								</Badge>
							</Anchor>
						))}
					</Stack>

					{tasks.length === 0 ? (
						<Text class={css({ color: "fg.muted" })}>
							No tasks assigned yet.
						</Text>
					) : (
						<>
							{/* Empty state — visibility toggled by the Search island */}
							<div
								id="assignee-tasks-search-empty"
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
										render: (task: Task) => (
											<Badge
												variant="subtle"
												size="sm"
												colorPalette={TASK_STATUS_COLOR[task.status]}
											>
												{task.status}
											</Badge>
										),
									},
									{
										header: "Priority",
										key: "priority",
										sortable: true,
										sortValue: (task: Task) =>
											TASK_PRIORITIES.indexOf(task.priority),
										render: (task: Task) => (
											<Badge
												variant="subtle"
												size="sm"
												colorPalette={TASK_PRIORITY_COLOR[task.priority]}
											>
												{task.priority}
											</Badge>
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
								rows={tasks}
							/>
						</>
					)}
				</div>
			</>,
		);
	},
);
