import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { TRANSLATED_LOCALES } from "../../../../lib/i18n";
import { loadPosts } from "../../../../lib/posts";
import byTagRoute from "../../by-tag/[tag]";

// Reuse the exact same per-request handler as the unprefixed /blog/by-tag/:tag
// route — `createRoute(ssgParamsMiddleware, handler)` is a typed 2-tuple (see
// honox/factory), so index 1 is always the handler. detectLocale() reads the
// locale straight off the URL path, so the handler itself needs no changes to
// also serve this locale-prefixed variant.
const [, byTagHandler] = byTagRoute;

export default createRoute(
	// Tags are locale-independent matching keys (see app/lib/posts.ts), so
	// every locale gets the same tag set — this just needs the full
	// {locale, tag} cross product for SSG to pre-render each combination.
	ssgParams(async () => {
		const { tags } = await loadPosts();
		const params: { locale: string; tag: string }[] = [];
		for (const locale of TRANSLATED_LOCALES) {
			for (const tag of tags) {
				params.push({ locale, tag });
			}
		}
		return params;
	}),
	byTagHandler,
);
