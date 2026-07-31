import { css, cx } from "design-system/css";
import { heading, text } from "design-system/recipes";
import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import {
	Anchor,
	Avatar,
	Badge,
	Heading,
	Stack,
	Text,
} from "../../components/ui";
import { Toaster } from "../../components/ui/toast";
import AuthStatus from "../../islands/auth-status";
import TaskActionsMenu from "../../islands/task-actions-menu";
import TaskEditableText from "../../islands/task-editable-text";
import TaskProjectEditor from "../../islands/task-project-editor";
import TaskSubtasks from "../../islands/task-subtasks";
import { loadDocsConfig } from "../../lib/configs";
import { mergeColorOverrides } from "../../lib/pms-config";
import { listProjects, loadProjectBySlug } from "../../lib/projects";
import {
	descendantsOf,
	listTaskSlugs,
	listTasks,
	loadTaskBySlug,
	subtasksOf,
	TASK_PRIORITY_COLOR,
	TASK_STATUS_COLOR,
} from "../../lib/tasks";
import { formatDate } from "../../utils/date";

export default createRoute(
	ssgParams(() => {
		return listTaskSlugs().map((slug) => ({ slug }));
	}),

	async (c) => {
		const slug = c.req.param("slug");
		const task = await loadTaskBySlug(slug);
		if (!task) return c.notFound();

		const [project, projects, allTasks, config] = await Promise.all([
			loadProjectBySlug(task.project),
			listProjects(),
			listTasks(),
			loadDocsConfig("en"),
		]);
		const statusColor = mergeColorOverrides(
			TASK_STATUS_COLOR,
			config.pms?.statusColors,
		);
		const priorityColor = mergeColorOverrides(
			TASK_PRIORITY_COLOR,
			config.pms?.priorityColors,
		);
		const projectItems = projects.map((p) => ({
			label: p.title,
			value: p.slug,
		}));
		// Includes the current task itself — it's the default/selected value for
		// the "+ Add subtask" flow's parent-task field (a brand-new task can't
		// actually create a cycle by picking any existing task as its parent).
		const taskItems = allTasks.map((t) => ({ label: t.title, value: t.slug }));
		const parentTask = task.parentTask
			? allTasks.find((t) => t.slug === task.parentTask)
			: undefined;
		const subtasks = subtasksOf(allTasks, task.slug);
		// Excludes this task and its own descendants from "Convert to...
		// Subtask"'s parent picker — picking either would just get silently
		// flattened back to top-level by buildTaskTree's cycle guard.
		const excludedFromConvert = new Set([
			task.slug,
			...descendantsOf(allTasks, task.slug).map((t) => t.slug),
		]);
		const convertTaskItems = allTasks
			.filter((t) => !excludedFromConvert.has(t.slug))
			.map((t) => ({ label: t.title, value: t.slug }));

		return c.render(
			<>
				<title>{task.title} - Tasks - Artefact</title>
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
							<TaskActionsMenu
								editHref={`/admin/#/collections/tasks/entries/${task.slug}`}
								slug={task.slug}
								title={task.title}
								excerpt={task.excerpt}
								priority={task.priority}
								assignee={task.assignee}
								dueDate={task.dueDate}
								tags={task.tags}
								parentTask={task.parentTask}
								tasks={convertTaskItems}
							/>
							<AuthStatus />
						</nav>
					</div>
				</header>

				<div
					class={css({
						py: { base: "8", md: "12" },
						px: { base: "4", md: "6", lg: "8" },
						maxWidth: "3xl",
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
						← Tasks
					</Anchor>

					{parentTask && (
						<Text size="sm" class={css({ color: "fg.muted", mb: "1" })}>
							Subtask of{" "}
							<Anchor href={`/tasks/${parentTask.slug}`} variant="plain">
								{parentTask.title}
							</Anchor>
						</Text>
					)}

					<Stack align="start" gap="3" wrap="wrap" class={css({ mb: "4" })}>
						<TaskEditableText
							as="h1"
							value={task.title}
							editHref={`/admin/#/collections/tasks/entries/${task.slug}`}
							textClass={heading({ size: "3xl" })}
							placeholder="Task title"
							slug={task.slug}
							field="title"
						/>
						<Badge variant="subtle" colorPalette={statusColor[task.status]}>
							{task.status}
						</Badge>
						<Badge variant="subtle" colorPalette={priorityColor[task.priority]}>
							{task.priority}
						</Badge>
					</Stack>

					<Stack gap="5" wrap="wrap" align="center" class={css({ mb: "6" })}>
						<TaskProjectEditor
							value={task.project}
							projects={projectItems}
							editHref={`/admin/#/collections/tasks/entries/${task.slug}`}
						/>
						{project && (
							<Anchor
								href={`/projects/${project.slug}`}
								variant="plain"
								class={css({ textStyle: "sm" })}
							>
								View project →
							</Anchor>
						)}
						{task.assignee && (
							<Stack gap="2" align="center">
								<Avatar size="xs" name={task.assignee} />
								<Text size="sm" class={css({ color: "fg.muted" })}>
									{task.assignee}
								</Text>
							</Stack>
						)}
						{task.dueDate && (
							<Text size="sm" class={css({ color: "fg.muted" })}>
								Due {formatDate(task.dueDate)}
							</Text>
						)}
					</Stack>

					{task.body && (
						<TaskEditableText
							value={task.body}
							editHref={`/admin/#/collections/tasks/entries/${task.slug}`}
							textClass={cx(text({ size: "md" }), css({ color: "fg" }))}
							placeholder="Description"
							class={css({ mb: "6" })}
							multiline
							rows={8}
							slug={task.slug}
							field="body"
							markdown
						/>
					)}

					{task.tags.length > 0 && (
						<Stack gap="2" wrap="wrap" class={css({ mb: "6" })}>
							{task.tags.map((tag) => (
								<Badge key={tag} variant="subtle" colorPalette="gray" size="sm">
									{tag}
								</Badge>
							))}
						</Stack>
					)}

					<TaskSubtasks
						task={task}
						subtasks={subtasks}
						projects={projectItems}
						tasks={taskItems}
						statusColors={statusColor}
					/>
				</div>
			</>,
		);
	},
);
