import { css } from "design-system/css";
import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { PageRenderer } from "../../components/page-renderer";
import { isLocale, TRANSLATED_LOCALES } from "../../lib/i18n";
import { listPageSlugs, loadPage } from "../../lib/pages";
import { RESERVED_PAGE_SLUGS } from "../../lib/reserved-page-slugs";

// The canonical translated-content-page URL: `/<slug>/<locale>` (e.g.
// /about/zh) — shorter than, but otherwise equivalent to,
// `/pages/<locale>/<slug>` (still served as-is by
// app/routes/pages/[slug].tsx for existing links/bookmarks).
//
// This route only renders for the dev server: like app/routes/[page].tsx,
// its handler takes `(c, next)`, which @hono/vite-ssg's route discovery
// treats as middleware and excludes from static generation — so it produces
// no file in `dist/` on `bun run build`. The actual production output comes
// from vite.config.ts's `copyLocalizedContentPagesPlugin`, which copies the
// already-correctly-generated `dist/pages/<locale>/<slug>.html` (no such
// SSG conflict) to `dist/<slug>/<locale>.html` as a build step. Keeping this
// route (rather than deleting it) is purely so `bun run dev` can preview the
// same content the build step will produce.
//
// Guarded tightly (known content-page slug + real translated locale) since
// this file sits at the routing root with a dynamic first segment — same
// shadowing risk `RESERVED_PAGE_SLUGS` exists for on `app/routes/[page].tsx`.
// For anything else (e.g. /blog/de, /docs/Introduction) it defers via `next()`.
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
			!page ||
			RESERVED_PAGE_SLUGS.has(page) ||
			!isLocale(locale) ||
			!listPageSlugs().includes(page)
		) {
			return next();
		}

		try {
			const data = await loadPage(page, locale);

			if (!data) {
				return next();
			}

			return c.render(
				<div
					class={css({
						maxWidth: "5xl",
						mx: "auto",
						px: "4",
						py: "12",
						display: "flex",
						flexDirection: "column",
						gap: "10",
					})}
				>
					<title>{data.title}</title>
					<PageRenderer
						content={data.content ?? []}
						locale={locale}
						currentPath={c.req.path}
					/>
				</div>,
			);
		} catch (error) {
			console.error(`Error loading page ${page} (${locale}):`, error);
			return next();
		}
	},
);
