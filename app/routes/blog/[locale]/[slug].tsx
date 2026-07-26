import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { TRANSLATED_LOCALES } from "../../../lib/i18n";
import { loadPosts } from "../../../lib/posts";
import slugRoute from "../[slug]";

// Reuse the exact same per-request handler as the unprefixed /blog/:slug
// route — `createRoute(ssgParamsMiddleware, handler)` is a typed 2-tuple (see
// honox/factory), so index 1 is always the handler. detectLocale() reads the
// locale straight off the URL path, so the handler itself needs no changes to
// also serve this locale-prefixed variant.
const [, slugHandler] = slugRoute;

export default createRoute(
	ssgParams(async () => {
		const params: { locale: string; slug: string }[] = [];
		for (const locale of TRANSLATED_LOCALES) {
			const { posts } = await loadPosts(locale);
			for (const post of posts) {
				params.push({ locale, slug: post.slug });
			}
		}
		return params;
	}),
	slugHandler,
);
