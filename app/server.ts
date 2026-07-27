import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { showRoutes } from "hono/dev";
import { createApp } from "honox/server";
import { isLocale } from "./lib/i18n";

const __dirname = join(fileURLToPath(import.meta.url), "..");

const app = createApp({
	routes: import.meta.glob(
		[
			"/app/routes/**/*.{ts,tsx,md,mdx}",
			"/app/routes/.well-known/**/*.{ts,tsx,md,mdx}",
			"!/app/routes/**/_*.{ts,tsx,md,mdx}",
			"!/app/routes/**/-*.{ts,tsx,md,mdx}",
			"!/app/routes/**/$*.{ts,tsx,md,mdx}",
			"!/app/routes/**/*.test.{ts,tsx}",
			"!/app/routes/**/*.spec.{ts,tsx}",
			"!/app/routes/**/-*/**/*",
		],
		{ eager: true },
	),
});

// Redirect legacy route structure /<collection>/<locale>/<item> to the
// current locale-first shape /<locale>/<collection>/<item> — or, for
// "pages", the short form /<locale>/<item> that drops the collection
// segment entirely (see app/lib/i18n.ts's top-of-file doc comment for why
// locale comes first: it avoids a router collision between a collection's
// locale-index route and its English detail route at the same segment shape).
app.use("*", async (c, next) => {
	const url = new URL(c.req.url);
	const segments = url.pathname.split("/").filter(Boolean);
	if (
		segments.length >= 2 &&
		["docs", "blog", "pages"].includes(segments[0]!) &&
		isLocale(segments[1])
	) {
		const collection = segments[0]!;
		const locale = segments[1]!;
		const rest = segments.slice(2).join("/");
		const targetPath =
			collection === "pages"
				? `/${locale}${rest ? `/${rest}` : ""}`
				: rest
					? `/${locale}/${collection}/${rest}`
					: `/${locale}/${collection}`;
		const search = url.search;
		return c.redirect(`${targetPath}${search}`, 301);
	}
	await next();
});

// Serve static files from public/ for /admin/* path
// This allows Sveltia CMS to load config.yml and other static files
app.use("/admin/*", async (c, next) => {
	const url = new URL(c.req.url);
	let filePath = join(__dirname, "..", "public", url.pathname);

	// Handle directory index (e.g., /admin/ -> /admin/index.html)
	if (url.pathname.endsWith("/")) {
		filePath = join(filePath, "index.html");
	}

	try {
		if (existsSync(filePath) && statSync(filePath).isFile()) {
			const content = readFileSync(filePath);
			const ext = filePath.split(".").pop()?.toLowerCase();
			const mimeTypes: Record<string, string> = {
				".html": "text/html",
				".css": "text/css",
				".js": "application/javascript",
				".json": "application/json",
				".png": "image/png",
				".yml": "text/yaml",
				".yaml": "text/yaml",
			};
			const mimeType = mimeTypes[`.${ext}`] || "application/octet-stream";

			return new Response(content, {
				headers: { "Content-Type": mimeType },
			});
		}
	} catch (error) {
		console.error(`Error serving ${filePath}:`, error);
	}

	return next();
});

// Handle /admin (without trailing slash) - redirect to /admin/
app.get("/admin", (c) => {
	return c.redirect("/admin/");
});

showRoutes(app);

export default app;
