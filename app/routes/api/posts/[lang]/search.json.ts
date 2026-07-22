import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { ALL_LOCALES, isLocale } from "../../../../lib/i18n";
import { loadPosts } from "../../../../lib/posts";
import type { SearchIndexDocument } from "../../../../utils/search";

// GET /api/posts/:lang/search.json — locale-scoped post search index for the
// Search component on blog pages.
//
// A dynamic segment can't be combined with a literal prefix/suffix in
// honox's file router (see app/routes/api/posts/[slug].json.ts), so the
// locale gets its own directory segment instead of a `search.[lang].json`
// filename.
export default createRoute(
	ssgParams(async () => {
		return ALL_LOCALES.filter((locale) => locale !== "en").map((lang) => ({
			lang,
		}));
	}),
	async (c) => {
		const lang = c.req.param("lang");
		if (!isLocale(lang)) {
			return c.notFound();
		}
		const { searchEntries } = await loadPosts(lang);

		const document: SearchIndexDocument = {
			generated: new Date().toISOString(),
			entries: searchEntries,
		};

		return c.json(document);
	},
);
