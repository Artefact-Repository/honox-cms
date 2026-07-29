import { createRoute } from "honox/factory";
import { listProjects } from "../../../lib/projects";
import { buildTaskSearchEntries, listTasks } from "../../../lib/tasks";
import type { SearchIndexDocument } from "../../../utils/search";

// GET /api/tasks/search.json — aggregated task data for the Search island on
// /tasks. Prerendered by @hono/vite-ssg into dist/api/tasks/search.json, so
// on the deployed static site this is a plain JSON file fetched lazily by
// the client, same as /api/posts/search.json and /api/docs/search.json.
export default createRoute(async (c) => {
	const [tasks, projects] = await Promise.all([listTasks(), listProjects()]);
	const projectTitleBySlug = new Map(
		projects.map((project) => [project.slug, project.title]),
	);

	const document: SearchIndexDocument = {
		generated: new Date().toISOString(),
		entries: buildTaskSearchEntries(tasks, projectTitleBySlug),
	};

	return c.json(document);
});
