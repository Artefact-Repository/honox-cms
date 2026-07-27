import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { listPageSlugs, loadPage } from "../../../lib/pages";

export default createRoute(
	ssgParams(() => {
		return listPageSlugs().map((slug) => ({ "slug.json": `${slug}.json` }));
	}),
	async (c) => {
		const slug = c.req.param("slug.json").replace(/\.json$/, "");
		const data = await loadPage(slug);

		if (!data) {
			return c.json({ error: "Page not found" }, 404);
		}

		return c.json(data);
	},
);
