import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { isLocale, TRANSLATED_LOCALES } from "../../lib/i18n";
import { listPageSlugs } from "../../lib/pages";
import { RESERVED_PAGE_SLUGS } from "../../lib/reserved-page-slugs";

// Alias so `/<slug>/<locale>` (e.g. /about/zh) also works, redirecting to
// the canonical `/pages/<locale>/<slug>` URL that `app/routes/pages/[slug].tsx`
// actually renders (see app/lib/i18n.ts's route-structure doc comment —
// locale comes *before* the slug there, this route just accepts the reverse
// order too rather than 404ing).
//
// Guarded tightly (known content-page slug + real locale) since this file
// sits at the routing root with a dynamic first segment, the same shadowing
// risk `RESERVED_PAGE_SLUGS` exists for on `app/routes/[page].tsx` — for
// anything else (e.g. /blog/de, /docs/Introduction) it defers via `next()`.
export default createRoute(
	ssgParams(() =>
		listPageSlugs()
			.filter((slug) => !RESERVED_PAGE_SLUGS.has(slug))
			.flatMap((page) =>
				TRANSLATED_LOCALES.map((locale) => ({ page, locale })),
			),
	),
	async (c, next) => {
		const page = c.req.param("page");
		const locale = c.req.param("locale");

		if (
			RESERVED_PAGE_SLUGS.has(page) ||
			!isLocale(locale) ||
			!listPageSlugs().includes(page)
		) {
			return next();
		}

		return c.redirect(
			locale === "en" ? `/${page}` : `/${page}/${locale}`,
			301,
		);
	},
);
