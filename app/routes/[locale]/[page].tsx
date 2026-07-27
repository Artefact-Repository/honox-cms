import { css } from "design-system/css";
import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { PageRenderer } from "../../components/page-renderer";
import { isLocale, TRANSLATED_LOCALES } from "../../lib/i18n";
import { listPageSlugs, loadPage } from "../../lib/pages";
import { RESERVED_PAGE_SLUGS } from "../../lib/reserved-page-slugs";

// The canonical translated-content-page URL: `/<locale>/<page>` (e.g.
// /zh/about) — matches docs/blog's locale-first convention, and is shorter
// than, but otherwise equivalent to, `/<locale>/pages/<page>` (still served
// as-is by app/routes/[locale]/pages/[slug].tsx for existing links/bookmarks).
//
// This route only renders for the dev server: like app/routes/[page].tsx,
// its handler takes `(c, next)`, which @hono/vite-ssg's route discovery
// treats as middleware and excludes from static generation — so it produces
// no file in `dist/` on `bun run build`. The actual production output comes
// from vite.config.ts's `copyLocalizedContentPagesPlugin`, which copies the
// already-correctly-generated `dist/<locale>/pages/<page>.html` (no such SSG
// conflict) to `dist/<locale>/<page>.html` as a build step.
//
// The guard here isn't just belt-and-suspenders: this file sits alongside
// app/routes/[locale]/{blog,docs,pages} with the identical dynamic-first-
// segment shape (`/:locale/:page` vs. e.g. `/:locale/blog`), and verified
// empirically (raw Hono, no HonoX) that WITHOUT an explicit defer-if-reserved
// guard, this shape can silently swallow `/de/blog`/`/de/docs` depending on
// file registration order alone — `[locale]` sorts before `blog`/`docs`
// alphabetically, which is exactly the losing order. The 2-arg `next()`
// guard makes this safe regardless of order, same as app/routes/[page].tsx.
export default createRoute(
	ssgParams(() =>
		TRANSLATED_LOCALES.flatMap((locale) =>
			listPageSlugs()
				.filter((page) => !RESERVED_PAGE_SLUGS.has(page))
				.map((page) => ({ locale, page })),
		),
	),
	async (c, next) => {
		const locale = c.req.param("locale");
		const page = c.req.param("page");

		if (
			!page ||
			!isLocale(locale) ||
			RESERVED_PAGE_SLUGS.has(page) ||
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
