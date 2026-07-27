import { css } from "design-system/css";
import { createRoute } from "honox/factory";
import type { ComponentBlock } from "../../../components/block-types";
import { PageRenderer } from "../../../components/page-renderer";
import { detectLocale } from "../../../lib/i18n";

interface PreviewRequestBody {
	title?: string;
	content?: ComponentBlock[];
}

// POST /api/pages/preview — dev-only helper for the Playground page
// (app/routes/playground.tsx): renders an arbitrary, not-yet-saved block
// tree through the same PageRenderer used by /pages/[slug], so an edited
// JSON draft can be live-previewed without writing it to content/pages/
// first. Only reachable while the Hono dev/edge server is running — the
// static (@hono/vite-ssg) build has no server to POST to.
export const POST = createRoute(async (c) => {
	let body: PreviewRequestBody;
	try {
		body = await c.req.json();
	} catch {
		return c.text("Invalid JSON body", 400);
	}

	const content = Array.isArray(body.content) ? body.content : [];
	const currentLocale = detectLocale(c.req.path);

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
			<title>{body.title ?? "Preview"}</title>
			<PageRenderer
				content={content}
				locale={currentLocale}
				currentPath={c.req.path}
			/>
		</div>,
	);
});
