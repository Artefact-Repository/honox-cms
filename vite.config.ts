import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readdirSync,
	renameSync,
	statSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import adapter from "@hono/vite-dev-server/node";
import ssg from "@hono/vite-ssg";
import mdx from "@mdx-js/rollup";
import honox, { devServerDefaultOptions } from "honox/vite";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";
import pandaConfig from "./panda.config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// After SSG build, recursively move any X.html to X/index.html if X/ directory exists,
// or if X.html is a root-level or nested locale index page (e.g., zh.html, es.html, pt.html, fr.html).
// This prevents static routing conflicts and 404 errors on static hosts.
function fixSsgRoutingPlugin() {
	return {
		name: "fix-ssg-routing",
		closeBundle: async () => {
			const distDir = path.resolve(__dirname, "dist");
			const locales = ["zh", "es", "pt", "fr"];

			function traverse(currentDir: string) {
				const entries = readdirSync(currentDir, { withFileTypes: true });

				for (const entry of entries) {
					const fullPath = path.join(currentDir, entry.name);

					if (entry.isDirectory()) {
						traverse(fullPath);
					} else if (entry.isFile() && entry.name.endsWith(".html")) {
						if (entry.name === "index.html" || entry.name === "404.html") {
							continue;
						}

						const routeName = entry.name.replace(/\.html$/, "");
						const dirPath = path.join(currentDir, routeName);
						const indexPath = path.join(dirPath, "index.html");

						const isLocaleRoute = locales.includes(routeName);
						const dirExists =
							existsSync(dirPath) && statSync(dirPath).isDirectory();

						if (dirExists || isLocaleRoute) {
							if (!existsSync(dirPath)) {
								mkdirSync(dirPath, { recursive: true });
							}
							renameSync(fullPath, indexPath);
							const relHtml = path.relative(distDir, fullPath);
							const relIndex = path.relative(distDir, indexPath);
							console.log(
								`[fix-ssg-routing] ✓ dist/${relHtml} → dist/${relIndex}`,
							);
						}
					}
				}
			}

			if (existsSync(distDir)) {
				traverse(distDir);
			}

			// Locale homepages (zh/es/pt/fr) are emitted as a flat dist/<lang>.html
			// with NO sibling dist/<lang>/ directory, so the loop above skips them.
			// Move each to dist/<lang>/index.html so /<lang> resolves as a directory
			// index on any static host, not just ones that rewrite .html clean URLs.
			const LOCALE_HOMEPAGES = ["zh", "es", "pt", "fr"];
			for (const lang of LOCALE_HOMEPAGES) {
				const htmlPath = path.join(distDir, `${lang}.html`);
				if (!existsSync(htmlPath) || !statSync(htmlPath).isFile()) continue;
				const dirPath = path.join(distDir, lang);
				const indexPath = path.join(dirPath, "index.html");
				mkdirSync(dirPath, { recursive: true });
				renameSync(htmlPath, indexPath);
				console.log(
					`[fix-ssg-routing] ✓ dist/${lang}.html → dist/${lang}/index.html`,
				);
			}
		},
	};
}

// app/routes/[page].tsx exposes every content/pages/*.json file at its bare
// root path (e.g. /wisp), but its handler must call `next()` — not
// `c.notFound()` — on a miss so it defers to sibling static routes (/de,
// /blog, /docs) instead of shadowing them (see app/routes/[page].tsx for why).
// `next()` requires a 2-arg (c, next) handler, and @hono/vite-ssg's route
// discovery (hono/dist/helper/ssg/utils.js `isMiddleware`) treats any
// 2-arg handler as middleware and silently excludes it from static
// generation — so this route never gets prerendered on its own.
// app/routes/pages/[slug].tsx has no such conflict (nothing else registers
// "/pages/<anything>") and DOES get prerendered correctly, so we just copy
// its already-correct output to the bare root path for every page slug.
function copyContentPagesToRootPlugin() {
	return {
		name: "copy-content-pages-to-root",
		closeBundle: async () => {
			const distDir = path.resolve(__dirname, "dist");
			const pagesDir = path.resolve(__dirname, "content/pages");
			const pagesDistDir = path.join(distDir, "pages");
			if (!existsSync(pagesDistDir)) return;

			const slugs = readdirSync(pagesDir, { withFileTypes: true })
				.filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
				.map((entry) => entry.name.replace(/\.json$/, ""))
				.filter((slug) => slug !== "index");

			for (const slug of slugs) {
				const source = path.join(pagesDistDir, `${slug}.html`);
				const dest = path.join(distDir, `${slug}.html`);
				if (!existsSync(source)) continue;
				if (existsSync(dest)) {
					console.warn(
						`[copy-content-pages-to-root] ⚠ dist/${slug}.html already exists — skipping (rename the content page or the conflicting route)`,
					);
					continue;
				}
				copyFileSync(source, dest);
				console.log(
					`[copy-content-pages-to-root] ✓ dist/pages/${slug}.html → dist/${slug}.html`,
				);
			}
		},
	};
}

const config = defineConfig(({ mode }) =>
	mode === "client" ? clientConfig : mainConfig(mode),
);

const mainConfig = (_mode: string) => ({
	resolve: {
		alias: {
			"design-system": path.resolve(__dirname, "design-system"),
		},
	},
	build: {
		minify: "oxc" as const,
		emptyOutDir: false,
	},
	oxc: {
		jsxImportSource: "hono/jsx",
	},
	// The remark/rehype/yaml pipeline in app/utils/markdown.ts pulls in a few
	// packages the SSG build's SSR module runner can't safely inline/transform
	// as ESM (either old-style CJS with no `type: module`, like `extend`, or a
	// dual CJS/ESM package where the runner resolves the `require()`-using CJS
	// build, like `yaml`) — force Node's native module loader to handle them.
	ssr: {
		external: ["extend", "yaml", "debug"],
	},
	plugins: [
		mdx({
			// Restrict to .mdx only — .md (blog posts under content/posts) stays
			// on the hand-rolled markdown.ts pipeline. Without this, the plugin's
			// transform hook also intercepts .md `?raw` imports (used by
			// app/lib/posts.ts) and corrupts them, since it strips the query
			// string before checking the extension.
			include: /\.mdx$/,
			jsxImportSource: "hono/jsx",
			remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
		}),
		honox({
			devServer: {
				adapter,
				exclude: [
					...devServerDefaultOptions.exclude,
					new RegExp(`^/${pandaConfig.outdir || "design-system"}/.*`),
				],
			},
		}),
		ssg({ entry: "app/server.ts" }),
		fixSsgRoutingPlugin(),
		copyContentPagesToRootPlugin(),
	],
});

const clientConfig = {
	resolve: {
		alias: {
			"design-system": path.resolve(__dirname, "design-system"),
		},
	},
	oxc: {
		jsxImportSource: "hono/jsx/dom",
	},
	build: {
		minify: "oxc" as const,
	},
	plugins: [
		honox({
			client: { input: ["/app/client.ts", "/app/style.css"] },
		}),
	],
};

export default config;
