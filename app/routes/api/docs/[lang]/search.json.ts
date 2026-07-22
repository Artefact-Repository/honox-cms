import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { loadDocsSearchIndex } from "../../../../lib/docs";
import { ALL_LOCALES, isLocale } from "../../../../lib/i18n";
import type { SearchIndexDocument } from "../../../../utils/search";

// GET /api/docs/:lang/search.json — locale-scoped doc search index for the
// Search component in the docs header.
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
		const entries = await loadDocsSearchIndex(lang);

		const document: SearchIndexDocument = {
			generated: new Date().toISOString(),
			entries,
		};

		return c.json(document);
	},
);
