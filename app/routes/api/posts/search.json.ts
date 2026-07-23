import { createRoute } from "honox/factory";
import { loadPosts } from "../../../lib/posts";
import type { SearchIndexDocument } from "../../../utils/search";

// GET /api/posts/search.json — aggregated *English-only* post data for the
// Search component. Prerendered by @hono/vite-ssg into
// dist/api/posts/search.json, so on the deployed static site this is a plain
// JSON file fetched lazily by the client. Migrated from the old top-level
// /search-index.json route. Locale-scoped indexes live at
// /api/posts/:lang/search.json (app/routes/api/posts/[lang]/search.json.ts)
// — pinned to "en" explicitly here rather than relying on loadPosts()'s
// default, so this route can never drift to another locale.
export default createRoute(async (c) => {
	const { searchEntries } = await loadPosts("en");

	const document: SearchIndexDocument = {
		generated: new Date().toISOString(),
		entries: searchEntries,
	};

	return c.json(document);
});
