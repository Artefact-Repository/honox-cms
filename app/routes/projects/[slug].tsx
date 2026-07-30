import { css, cx } from "design-system/css";
import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import {
	Anchor,
	Avatar,
	Badge,
	DisplayValue,
	Heading,
	Progress,
	Search,
	Stack,
	Table,
	Tabs,
	Text,
} from "../../components/ui";
import { colorPaletteClass } from "../../components/ui/color-palette";
import { Toaster } from "../../components/ui/toast";
import AuthStatus from "../../islands/auth-status";
import PmsCreateMenu from "../../islands/pms-create-menu";
import TaskBoard from "../../islands/task-board";
import { loadDocsConfig } from "../../lib/configs";
import {
	listProjectSlugs,
	listProjects,
	loadProjectBySlug,
	PROJECT_STATUS_COLOR,
} from "../../lib/projects";
import { mergeColorOverrides } from "../../lib/pms-config";
import {
	buildTaskSearchEntries,
	listTasksByProject,
	TASK_PRIORITIES,
	TASK_PRIORITY_COLOR,
	TASK_STATUS_COLOR,
	TASK_STATUSES,
	type Task,
} from "../../lib/tasks";
import { formatDate } from "../../utils/date";
import { filterEntries } from "../../utils/search";

export default createRoute(
	ssgParams(() => {
		return listProjectSlugs().map((slug) => ({ slug }));
	}),

	async (c) => {
		const slug = c.req.param("slug");
		const project = await loadProjectBySlug(slug);
		if (!project) return c.notFound();

		const [tasks, allProjects, config] = await Promise.all([
			listTasksByProject(slug),
			listProjects(),
			loadDocsConfig("en"),
		]);
		const projectStatusColor = mergeColorOverrides(
			PROJECT_STATUS_COLOR,
			config.pms?.projectStatusColors,
		);
		const statusColor = mergeColorOverrides(
			TASK_STATUS_COLOR,
			config.pms?.statusColors,
		);
		const priorityColor = mergeColorOverrides(
			TASK_PRIORITY_COLOR,
			config.pms?.priorityColors,
		);
		const done = tasks.filter((task) => task.status === "Done").length;
		const projectItems = allProjects.map((p) => ({
			label: p.title,
			value: p.slug,
		}));

		// Server-side filtering for the no-JS ?q= fallback, same pattern as
		// /tasks: all rows still render (non-matches hidden) so the Search
		// island can broaden results client-side without a round-trip.
		const searchQuery = new URL(c.req.url).searchParams.get("q") || "";
		const matchedSlugs = new Set(
			filterEntries(buildTaskSearchEntries(tasks), searchQuery).map(
				(entry) => entry.key,
			),
		);

		return c.render(
			<>
				<title>{project.title} - Projects - Artefact</title>
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
							<div
								class={css({ flex: "1", maxWidth: "sm", minWidth: "160px" })}
							>
								<Search
									size="sm"
									src="/api/tasks/search.json"
									action={`/projects/${slug}`}
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
									fontWeight: "semibold",
									color: "fg",
									textDecoration: "none",
								})}
							>
								Projects
							</Anchor>
							<Anchor
								href="/tasks"
								variant="plain"
								class={css({
									textStyle: "sm",
									fontWeight: "medium",
									color: "fg.muted",
									textDecoration: "none",
									_hover: { color: "fg" },
								})}
							>
								Tasks
							</Anchor>
							<PmsCreateMenu
								projects={projectItems}
								defaultProjectSlug={slug}
								tasks={tasks.map((t) => ({ label: t.title, value: t.slug }))}
							/>
							<AuthStatus />
						</nav>
					</div>
				</header>

				<div
					class={css({
						py: { base: "8", md: "12" },
						px: { base: "4", md: "6", lg: "8" },
						maxWidth: "5xl",
						mx: "auto",
					})}
				>
					<Anchor
						href="/projects"
						variant="plain"
						class={css({
							textStyle: "sm",
							color: "fg.muted",
							mb: "3",
							display: "inline-block",
						})}
					>
						← Projects
					</Anchor>

					<Stack align="center" gap="3" wrap="wrap" class={css({ mb: "2" })}>
						<Heading as="h1" size="3xl">
							{project.title}
						</Heading>
						<Badge
							variant="subtle"
							colorPalette={projectStatusColor[project.status]}
						>
							{project.status}
						</Badge>
					</Stack>

					{project.description && (
						<Text class={css({ color: "fg.muted", mb: "4", maxWidth: "3xl" })}>
							{project.description}
						</Text>
					)}

					<Stack gap="5" wrap="wrap" class={css({ mb: "6" })}>
						{project.owner && (
							<Stack gap="2" align="center">
								<Avatar size="xs" name={project.owner} />
								<Text size="sm" class={css({ color: "fg.muted" })}>
									{project.owner}
								</Text>
							</Stack>
						)}
						{project.startDate && (
							<Text size="sm" class={css({ color: "fg.muted" })}>
								Started {formatDate(project.startDate)}
							</Text>
						)}
						{project.dueDate && (
							<Text size="sm" class={css({ color: "fg.muted" })}>
								Due {formatDate(project.dueDate)}
							</Text>
						)}
					</Stack>

					{tasks.length > 0 && (
						<Progress
							value={done}
							max={tasks.length}
							size="sm"
							showValueText
							valueText={`${done}/${tasks.length} tasks done`}
							class={cx(
								colorPaletteClass(projectStatusColor[project.status]),
								css({ mb: "8", maxWidth: "sm" }),
							)}
						/>
					)}

					{/* Empty state — visibility toggled by the Search island */}
					<div
						id="project-tasks-search-empty"
						hidden={tasks.length === 0 || matchedSlugs.size !== 0}
						class={css({ textAlign: "center", py: "16", px: "4" })}
					>
						<Text class={css({ color: "fg.muted" })}>
							No tasks match your search.
						</Text>
					</div>

					<Tabs interactive defaultValue="board">
						<Tabs.List class={css({ mb: "6" })}>
							<Tabs.Trigger value="board">Board</Tabs.Trigger>
							<Tabs.Trigger value="list">List</Tabs.Trigger>
						</Tabs.List>

						<Tabs.Content value="board">
							{tasks.length === 0 ? (
								<Text class={css({ color: "fg.muted" })}>No tasks yet.</Text>
							) : (
								<TaskBoard
								tasks={tasks}
								statusColors={statusColor}
								priorityColors={priorityColor}
							/>
							)}
						</Tabs.Content>

						<Tabs.Content value="list">
							{tasks.length === 0 ? (
								<Text class={css({ color: "fg.muted" })}>No tasks yet.</Text>
							) : (
								<Table
									getRowProps={(task: Task) => ({
										"data-task-slug": task.slug,
										hidden: !matchedSlugs.has(task.slug),
									})}
									variant="surface"
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
													<Stack gap="2" align="center">
														<Avatar size="xs" name={task.assignee} />
														<Text size="sm">{task.assignee}</Text>
													</Stack>
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
							)}
						</Tabs.Content>
					</Tabs>
				</div>
			</>,
		);
	},
);
