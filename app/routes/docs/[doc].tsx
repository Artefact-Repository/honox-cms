import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { DocsLayout } from "../../components/docs-layout";
import { loadDocBySlug, loadDocs } from "../../lib/docs";
import { markdownContentClass } from "../../utils/markdown-content-style";

export default createRoute(
	ssgParams(async () => {
		const docs = await loadDocs();
		return docs.map((doc) => ({ doc: doc.slug }));
	}),

	async (c) => {
		const slug = c.req.param("doc");
		const [doc, docs] = await Promise.all([loadDocBySlug(slug), loadDocs()]);

		if (!doc) {
			return c.notFound();
		}

		return c.render(
			<DocsLayout docs={docs} activeSlug={slug}>
				<title>{doc.title} - Docs - Artefact</title>

				<div
					class={markdownContentClass}
					dangerouslySetInnerHTML={{ __html: doc.html }}
				/>
			</DocsLayout>,
		);
	},
);
