import { css } from "design-system/css";
import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { PageRenderer } from "../components/page-renderer";
import { detectLocale } from "../lib/i18n";
import { listPageSlugs, loadPage } from "../lib/pages";
import { RESERVED_PAGE_SLUGS } from "../lib/reserved-page-slugs";

export default createRoute(
	ssgParams(() =>
		listPageSlugs()
			.filter((slug) => !RESERVED_PAGE_SLUGS.has(slug))
			.map((page) => ({ page })),
	),
	async (c, next) => {
		const page = c.req.param("page");

		if (RESERVED_PAGE_SLUGS.has(page)) return next();

		const currentLocale = detectLocale(c.req.path);

		try {
			const data = await loadPage(page, currentLocale);

			// Not a content page — defer to any other route matching this path
			// (e.g. /de), since this file lives at the routing root and would
			// otherwise shadow it.
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
						locale={currentLocale}
						currentPath={c.req.path}
					/>
				</div>,
			);
		} catch (error) {
			console.error(`Error loading page ${page}:`, error);
			return next();
		}
	},
);
