import { css } from "design-system/css";
import { createRoute } from "honox/factory";
import { PageRenderer } from "../../components/page-renderer";
import { Search } from "../../components/ui";
import { Toaster } from "../../components/ui/toast";
import AuthStatus from "../../islands/auth-status";
import PmsCreateMenu from "../../islands/pms-create-menu";
import TaskAssigneeFilter from "../../islands/task-assignee-filter";
import TaskPriorityFilter from "../../islands/task-priority-filter";
import TaskStatusFilter from "../../islands/task-status-filter";
import { loadPage } from "../../lib/pages";
import { listProjects } from "../../lib/projects";
import { listTasks } from "../../lib/tasks";

export default createRoute(async (c) => {
	const [tasks, projects, data] = await Promise.all([
		listTasks(),
		listProjects(),
		loadPage("tasks", "en", { currentUrl: c.req.url }).then(
			(page) => page ?? { content: [] },
		),
	]);
	const projectItems = projects.map((project) => ({
		label: project.title,
		value: project.slug,
	}));
	const taskItems = tasks.map((task) => ({
		label: task.title,
		value: task.slug,
	}));
	const assignees = [...new Set(tasks.map((task) => task.assignee).filter((assignee): assignee is string => !!assignee))].sort();
	const searchQuery = new URL(c.req.url).searchParams.get("q") || "";

	const originalContent = data.content ?? [];
	const assigneeBlockIndex = originalContent.findIndex(
		(block) =>
			block.blockType === "stack" &&
			block.children?.some(
				(child) => child.blockType === "text" && child.content === "Assignee",
			),
	);
	const statusBlockIndex = originalContent.findIndex(
		(block) =>
			block.blockType === "stack" &&
			block.children?.some(
				(child) => child.blockType === "text" && child.content === "Status",
			),
	);
	const priorityBlockIndex = originalContent.findIndex(
		(block) =>
			block.blockType === "stack" &&
			block.children?.some(
				(child) => child.blockType === "text" && child.content === "Priority",
			),
	);

	let part1 = originalContent;
	let part2: typeof originalContent = [];
	let part3: typeof originalContent = [];
	let part4: typeof originalContent = [];

	if (assigneeBlockIndex !== -1 && statusBlockIndex !== -1 && priorityBlockIndex !== -1) {
		const idxs = [assigneeBlockIndex, statusBlockIndex, priorityBlockIndex].sort((a, b) => a - b);
		part1 = originalContent.slice(0, idxs[0]);
		part2 = originalContent.slice(idxs[0] + 1, idxs[1]);
		part3 = originalContent.slice(idxs[1] + 1, idxs[2]);
		part4 = originalContent.slice(idxs[2] + 1);
	} else if (statusBlockIndex !== -1 && priorityBlockIndex !== -1) {
		const firstIdx = Math.min(statusBlockIndex, priorityBlockIndex);
		const secondIdx = Math.max(statusBlockIndex, priorityBlockIndex);
		part1 = originalContent.slice(0, firstIdx);
		part2 = originalContent.slice(firstIdx + 1, secondIdx);
		part4 = originalContent.slice(secondIdx + 1);
	} else if (statusBlockIndex !== -1) {
		part1 = originalContent.slice(0, statusBlockIndex);
		part4 = originalContent.slice(statusBlockIndex + 1);
	} else if (priorityBlockIndex !== -1) {
		part1 = originalContent.slice(0, priorityBlockIndex);
		part4 = originalContent.slice(priorityBlockIndex + 1);
	}

	return c.render(
		<>
			<title>{data.title ?? "Tasks - Artefact"}</title>
			<Toaster />
			<style
				dangerouslySetInnerHTML={{
					__html: `
						tr[data-assignee-hidden="true"],
						tr[data-status-hidden="true"],
						tr[data-priority-hidden="true"] {
							display: none !important;
						}
					`,
				}}
			/>

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
					<PageRenderer content={data.headerBrand ?? []} />

					{tasks.length > 0 && (
						<div
							class={css({
								flex: "1",
								maxWidth: "sm",
								minWidth: "160px",
								display: "flex",
								gap: "2",
							})}
						>
							<div class={css({ flex: "1" })}>
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
							<div class={css({ flexShrink: 0 })}>
								<TaskStatusFilter />
							</div>
						</div>
					)}

					<nav class={css({ display: "flex", gap: "6", alignItems: "center" })}>
						<PageRenderer content={data.headerNav ?? []} />
						<PmsCreateMenu projects={projectItems} tasks={taskItems} />
						<PageRenderer content={data.headerActions ?? []} />
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
				<PageRenderer content={part1} />

				{assigneeBlockIndex !== -1 && (
					<div
						class={css({
							display: "flex",
							alignItems: "flex-start",
							gap: "2",
							marginBottom: "0.75rem",
						})}
					>
						<span
							class={css({
								fontSize: "xs",
								fontWeight: "600",
								textTransform: "uppercase",
								letterSpacing: "0.05em",
								color: "#71717a",
								minWidth: "64px",
								paddingTop: "2",
							})}
						>
							Assignee
						</span>
						<TaskAssigneeFilter assignees={assignees} />
					</div>
				)}

				<PageRenderer content={part2} />

				{statusBlockIndex !== -1 && (
					<div
						class={css({
							display: "flex",
							alignItems: "center",
							gap: "2",
							marginBottom: "0.75rem",
						})}
					>
						<span
							class={css({
								fontSize: "xs",
								fontWeight: "600",
								textTransform: "uppercase",
								letterSpacing: "0.05em",
								color: "#71717a",
								minWidth: "64px",
							})}
						>
							Status
						</span>
						<TaskStatusFilter />
					</div>
				)}

				<PageRenderer content={part3} />

				{priorityBlockIndex !== -1 && (
					<div
						class={css({
							display: "flex",
							alignItems: "center",
							gap: "2",
							marginBottom: "2rem",
						})}
					>
						<span
							class={css({
								fontSize: "xs",
								fontWeight: "600",
								textTransform: "uppercase",
								letterSpacing: "0.05em",
								color: "#71717a",
								minWidth: "64px",
							})}
						>
							Priority
						</span>
						<TaskPriorityFilter />
					</div>
				)}

				<PageRenderer content={part4} />
			</div>
		</>,
	);
});
