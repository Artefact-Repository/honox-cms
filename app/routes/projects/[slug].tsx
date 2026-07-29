import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import {
	Anchor,
	Avatar,
	Badge,
	Card,
	Heading,
	Progress,
	Stack,
	Table,
	Tabs,
	Text,
} from "../../components/ui";
import { colorPaletteClass } from "../../components/ui/color-palette";
import { PROJECT_STATUS_COLOR, listProjectSlugs, loadProjectBySlug } from "../../lib/projects";
import {
	TASK_PRIORITY_COLOR,
	TASK_STATUSES,
	TASK_STATUS_COLOR,
	type Task,
	listTasksByProject,
} from "../../lib/tasks";

function formatDate(value?: string) {
	if (!value) return undefined;
	return new Date(value).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function TaskCard({ task }: { task: Task }) {
	return (
		<Card
			variant="outline"
			colorPalette={TASK_PRIORITY_COLOR[task.priority]}
			bodyClass={css({ p: "3" })}
		>
			<Text size="sm" class={css({ fontWeight: "medium", mb: "2" })}>
				{task.title}
			</Text>
			<Stack align="center" justify="space-between">
				<Badge variant="subtle" size="sm" colorPalette={TASK_PRIORITY_COLOR[task.priority]}>
					{task.priority}
				</Badge>
				{task.assignee && <Avatar size="xs" name={task.assignee} />}
			</Stack>
			{task.dueDate && (
				<Text size="xs" class={css({ color: "fg.muted", mt: "2" })}>
					Due {formatDate(task.dueDate)}
				</Text>
			)}
		</Card>
	);
}

export default createRoute(
	ssgParams(() => {
		return listProjectSlugs().map((slug) => ({ slug }));
	}),

	async (c) => {
		const slug = c.req.param("slug");
		const project = await loadProjectBySlug(slug);
		if (!project) return c.notFound();

		const tasks = await listTasksByProject(slug);
		const done = tasks.filter((task) => task.status === "Done").length;

		return c.render(
			<>
				<title>{project.title} - Projects - Artefact</title>

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
								class={css({ fontSize: "lg", fontWeight: "bold", tracking: "tight" })}
							>
								Artefact UI
							</Heading>
						</Anchor>

						<nav class={css({ display: "flex", gap: "6", alignItems: "center" })}>
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
						maxWidth: "5xl",
						mx: "auto",
					})}
				>
					<Anchor
						href="/projects"
						variant="plain"
						class={css({ textStyle: "sm", color: "fg.muted", mb: "3", display: "inline-block" })}
					>
						← Projects
					</Anchor>

					<Stack align="center" gap="3" wrap="wrap" class={css({ mb: "2" })}>
						<Heading as="h1" size="3xl">
							{project.title}
						</Heading>
						<Badge variant="subtle" colorPalette={PROJECT_STATUS_COLOR[project.status]}>
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
								colorPaletteClass(PROJECT_STATUS_COLOR[project.status]),
								css({ mb: "8", maxWidth: "sm" }),
							)}
						/>
					)}

					<Tabs interactive defaultValue="board">
						<Tabs.List class={css({ mb: "6" })}>
							<Tabs.Trigger value="board">Board</Tabs.Trigger>
							<Tabs.Trigger value="list">List</Tabs.Trigger>
						</Tabs.List>

						<Tabs.Content value="board">
							{tasks.length === 0 ? (
								<Text class={css({ color: "fg.muted" })}>No tasks yet.</Text>
							) : (
								<div
									class={css({
										display: "grid",
										gridTemplateColumns: {
											base: "1fr",
											sm: "repeat(2, 1fr)",
											lg: "repeat(4, 1fr)",
										},
										gap: "4",
										alignItems: "start",
									})}
								>
									{TASK_STATUSES.map((status) => {
										const columnTasks = tasks.filter((task) => task.status === status);
										return (
											<div key={status}>
												<Stack align="center" justify="space-between" class={css({ mb: "3" })}>
													<Text
														size="xs"
														class={css({
															fontWeight: "semibold",
															textTransform: "uppercase",
															letterSpacing: "wide",
															color: "fg.muted",
														})}
													>
														{status}
													</Text>
													<Badge variant="subtle" size="sm" colorPalette={TASK_STATUS_COLOR[status]}>
														{columnTasks.length}
													</Badge>
												</Stack>
												<Stack direction="vertical" gap="3">
													{columnTasks.map((task) => (
														<TaskCard key={task.slug} task={task} />
													))}
												</Stack>
											</div>
										);
									})}
								</div>
							)}
						</Tabs.Content>

						<Tabs.Content value="list">
							{tasks.length === 0 ? (
								<Text class={css({ color: "fg.muted" })}>No tasks yet.</Text>
							) : (
								<Table
									variant="surface"
									columns={[
										{ header: "Task", key: "title" },
										{
											header: "Status",
											key: "status",
											render: (task: Task) => (
												<Badge variant="subtle" size="sm" colorPalette={TASK_STATUS_COLOR[task.status]}>
													{task.status}
												</Badge>
											),
										},
										{
											header: "Priority",
											key: "priority",
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
											render: (task: Task) => (
												<Text size="sm" class={css({ color: "fg.muted" })}>
													{formatDate(task.dueDate) ?? "—"}
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
