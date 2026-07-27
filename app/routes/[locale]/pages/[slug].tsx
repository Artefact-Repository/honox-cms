import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { TRANSLATED_LOCALES } from "../../../lib/i18n";
import { listPageSlugs } from "../../../lib/pages";
import slugRoute from "../../pages/[slug]";

// Reuse the exact same per-request handler as the unprefixed /pages/:slug
// route — detectLocale() reads the locale straight off the URL path, so the
// handler itself needs no changes to also serve this locale-prefixed variant.
//
// Safe to reuse directly (no `next()`/2-arg guard needed) — same reasoning
// as app/routes/[locale]/docs/index.tsx and app/routes/[locale]/blog/index.tsx:
// `/:locale/pages/:slug` doesn't share a segment shape with any other route,
// unlike the old `pages/[locale]/[slug].tsx` (nested the other way) never
// actually needed this — "pages" never had the same-shape collision problem
// docs/blog did, since `pages/[slug].tsx` (`/pages/:slug`) and the old
// hardcoded `pages/de/[slug].tsx` (`/pages/de/:slug`, literal "de", not
// dynamic) never competed for the same ssgParams. Moved here anyway to match
// the same locale-first convention as docs/blog for consistency, and to
// drop the 5 near-identical hardcoded per-locale files.
const [, slugHandler] = slugRoute;

export default createRoute(
	ssgParams(() => {
		const params: { locale: string; slug: string }[] = [];
		for (const locale of TRANSLATED_LOCALES) {
			for (const slug of listPageSlugs()) {
				params.push({ locale, slug });
			}
		}
		return params;
	}),
	slugHandler,
);
