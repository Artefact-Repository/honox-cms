import { css } from "design-system/css";
import { createRoute } from "honox/factory";
import { PageRenderer } from "../../components/page-renderer";
import { Search } from "../../components/ui";
import { Toaster } from "../../components/ui/toast";
import AuthStatus from "../../islands/auth-status";
import PmsCreateMenu from "../../islands/pms-create-menu";
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
	const searchQuery = new URL(c.req.url).searchParams.get("q") || "";

	return c.render(
		<>
			<title>{data.title ?? "Tasks - Artefact"}</title>
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
					<PageRenderer content={data.headerBrand ?? []} />

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
				<PageRenderer content={data.content ?? []} />
			</div>
		</>,
	);
});
