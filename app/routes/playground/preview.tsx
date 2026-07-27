import { readFileSync } from "node:fs";
import { join } from "node:path";
import { css } from "design-system/css";
import { createRoute } from "honox/factory";
import { PageRenderer } from "../../components/page-renderer";
import { Alert, AlertIcon } from "../../components/ui";

const handlePreview = async (c: any, method: string) => {
	let jsonStr = "";

	if (method === "POST") {
		try {
			const body = await c.req.parseBody();
			jsonStr = typeof body.json === "string" ? body.json : "";
		} catch (err) {
			console.error("Error parsing request body in playground preview:", err);
		}
	}

	// Fallback to default page (about.json) on GET or empty POST
	if (!jsonStr) {
		try {
			const filepath = join(process.cwd(), "content", "pages", "about.json");
			jsonStr = readFileSync(filepath, "utf-8");
		} catch (err) {
			jsonStr = "{}";
		}
	}

	let pageTitle = "Live Preview";
	let blocks: any[] = [];
	let parseError: string | null = null;

	try {
		const parsed = JSON.parse(jsonStr);
		if (parsed && typeof parsed === "object") {
			pageTitle = parsed.title || pageTitle;
			blocks = Array.isArray(parsed.content) ? parsed.content : (Array.isArray(parsed) ? parsed : []);
		} else {
			parseError = "JSON must be an object containing a 'content' array, or a raw array of component blocks.";
		}
	} catch (err: any) {
		parseError = err?.message || "Invalid JSON syntax.";
	}

	return c.render(
		<div
			class={css({
				bg: "bg.default",
				minH: "screen",
				color: "fg.default",
			})}
		>
			<title>{pageTitle}</title>

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
				{parseError ? (
					<Alert
						title="JSON Parsing Error"
						description={parseError}
						status="error"
						variant="subtle"
						indicator={<AlertIcon />}
					/>
				) : (
					<PageRenderer content={blocks} />
				)}
			</div>
		</div>,
	);
};

export const GET = createRoute(async (c) => {
	return handlePreview(c, "GET");
});

export const POST = createRoute(async (c) => {
	return handlePreview(c, "POST");
});
