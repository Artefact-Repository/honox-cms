import { css } from "design-system/css";
import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { DocsLayout } from "../../components/docs-layout";
import { Badge, Stack } from "../../components/ui";
import { loadDocBySlug, loadDocs } from "../../lib/docs";
import { markdownContentClass } from "../../utils/markdown-content-style";

const TIER_COLOR: Record<number, string> = {
	1: "purple",
	2: "blue",
	3: "gray",
};

const TIER_LABEL: Record<number, string> = {
	1: "Auto-interactive",
	2: "Smart auto-detect",
	3: "Presentational",
};

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

		const DocContent = doc.Component;

		return c.render(
			<DocsLayout docs={docs} activeSlug={slug}>
				<title>{doc.title} - Docs - Artefact</title>

				{(doc.category || doc.hydration) && (
					<Stack
						direction="horizontal"
						gap="2"
						align="center"
						class={css({ mb: "6" })}
					>
						{doc.category && (
							<Badge variant="subtle" colorPalette="cyan" size="sm">
								{doc.category}
							</Badge>
						)}
						{doc.hydration && (
							<Badge
								variant="subtle"
								colorPalette={TIER_COLOR[doc.hydration] ?? "gray"}
								size="sm"
							>
								{TIER_LABEL[doc.hydration] ?? `Tier ${doc.hydration}`}
							</Badge>
						)}
					</Stack>
				)}

				{DocContent ? (
					<div class={markdownContentClass}>
						<DocContent />
					</div>
				) : (
					<div
						class={markdownContentClass}
						dangerouslySetInnerHTML={{ __html: doc.html ?? "" }}
					/>
				)}
			</DocsLayout>,
		);
	},
);
