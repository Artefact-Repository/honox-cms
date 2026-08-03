import { createRoute } from "honox/factory";
import { listProjects, buildProjectSearchEntries } from "../../../lib/projects";
import type { SearchIndexDocument } from "../../../utils/search";

// GET /api/projects/search.json — aggregated project data for the Search island on
// /projects. Prerendered by @hono/vite-ssg into dist/api/projects/search.json, so
// on the deployed static site this is a plain JSON file fetched lazily by
// the client, same as /api/posts/search.json, /api/docs/search.json, and /api/tasks/search.json.
export default createRoute(async (c) => {
	const projects = await listProjects();

	const document: SearchIndexDocument = {
		generated: new Date().toISOString(),
		entries: buildProjectSearchEntries(projects),
	};

	return c.json(document);
});
