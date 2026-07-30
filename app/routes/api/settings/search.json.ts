import { createRoute } from "honox/factory";
import { buildSettingsSearchIndex } from "../../../lib/settings-fields";
import type { SearchIndexDocument } from "../../../utils/search";

// GET /api/settings/search.json — one entry per settings field across every
// /settings/<section> page, for the Search box in the settings sidenav.
// Prerendered by @hono/vite-ssg into dist/api/settings/search.json, so on the
// deployed static site this is a plain JSON file fetched lazily by the
// client — same pattern as /api/docs/search.json.
export default createRoute(async (c) => {
	const entries = await buildSettingsSearchIndex();

	const document: SearchIndexDocument = {
		generated: new Date().toISOString(),
		entries,
	};

	return c.json(document);
});
