import { css, cx } from "design-system/css";
import { button } from "design-system/recipes";
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
import { markdownContentClass } from "../../utils/markdown-content-style";
import { loadProjectBySlug } from "../../lib/projects";
import {
	TASK_PRIORITY_COLOR,
	TASK_STATUS_COLOR,
	listTaskSlugs,
	loadTaskBySlug,
} from "../../lib/tasks";

function formatDate(value?: string) {
	if (!value) return undefined;
	return new Date(value).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export default createRoute(
	ssgParams(() => {
		return listTaskSlugs().map((slug) => ({ slug }));
	}),

	async (c) => {
		const slug = c.req.param("slug");
		const task = await loadTaskBySlug(slug);
		if (!task) return c.notFound();

		const project = await loadProjectBySlug(task.project);

		return c.render(
			<>
				<title>{task.title} - Tasks - Artefact</title>

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
							<Anchor
								href={`/admin/#/collections/tasks/entries/${task.slug}`}
								class={cx(
									button({ variant: "outline", size: "sm" }),
									css({ textStyle: "sm", fontWeight: "medium" }),
								)}
							>
								Edit
							</Anchor>
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

					<Stack align="center" gap="3" wrap="wrap" class={css({ mb: "4" })}>
						<Heading as="h1" size="3xl">
							{task.title}
						</Heading>
						<Badge
							variant="subtle"
							colorPalette={TASK_STATUS_COLOR[task.status]}
						>
							{task.status}
						</Badge>
						<Badge
							variant="subtle"
							colorPalette={TASK_PRIORITY_COLOR[task.priority]}
						>
							{task.priority}
						</Badge>
					</Stack>

					<Stack gap="5" wrap="wrap" class={css({ mb: "6" })}>
						{project && (
							<Text size="sm" class={css({ color: "fg.muted" })}>
								Project{" "}
								<Anchor href={`/projects/${project.slug}`} variant="plain">
									{project.title}
								</Anchor>
							</Text>
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

					{task.html && (
						<div
							class={cx(markdownContentClass, css({ mb: "6" }))}
							dangerouslySetInnerHTML={{ __html: task.html }}
						/>
					)}

					{task.tags.length > 0 && (
						<Stack gap="2" wrap="wrap">
							{task.tags.map((tag) => (
								<Badge key={tag} variant="subtle" colorPalette="gray" size="sm">
									{tag}
								</Badge>
							))}
						</Stack>
					)}
				</div>
			</>,
		);
	},
);
