import { css } from "design-system/css";
import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { PageRenderer } from "../../components/page-renderer";
import { detectLocale } from "../../lib/i18n";
import { listPageSlugs, loadPage } from "../../lib/pages";

export default createRoute(
	ssgParams(() => listPageSlugs().map((slug) => ({ slug }))),
	async (c) => {
		const slug = c.req.param("slug");
		const currentLocale = detectLocale(c.req.path);

		try {
			const data = await loadPage(slug, currentLocale);

			if (!data) {
				return c.notFound();
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
			console.error(`Error loading page ${slug}:`, error);
			return c.notFound();
		}
	},
);
