import {
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

// After SSG build, for any route X where both X.html and X/ directory exist,
// move X.html → X/index.html so the static server can serve /X as X/index.html
// and /X/slug as X/slug.html without conflict.
function fixSsgRoutingPlugin() {
	return {
		name: "fix-ssg-routing",
		closeBundle: async () => {
			const distDir = path.resolve(__dirname, "dist");

			// Read top-level entries in dist/
			const entries = readdirSync(distDir, { withFileTypes: true });

			for (const entry of entries) {
				// Skip if not a .html file at the top level
				if (!entry.isFile() || !entry.name.endsWith(".html")) {
					continue;
				}

				const htmlFile = entry.name; // e.g., "blog.html"
				const routeName = htmlFile.replace(/\.html$/, ""); // e.g., "blog"
				const htmlPath = path.join(distDir, htmlFile); // e.g., "dist/blog.html"
				const dirPath = path.join(distDir, routeName); // e.g., "dist/blog"
				const indexPath = path.join(dirPath, "index.html"); // e.g., "dist/blog/index.html"

				// Check if a directory with the same name exists
				if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
					mkdirSync(dirPath, { recursive: true });
					renameSync(htmlPath, indexPath);
					console.log(
						`[fix-ssg-routing] ✓ dist/${htmlFile} → dist/${routeName}/index.html`,
					);
				}
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
		external: ["extend", "yaml"],
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
