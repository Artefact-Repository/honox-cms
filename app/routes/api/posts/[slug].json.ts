import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { loadPostBySlug, loadPosts } from "../../../lib/posts";

// GET /api/posts/:slug.json — a single post rendered to HTML, with related
// posts attached.
//
// The site deploys as static assets with no live server (see wrangler.jsonc:
// `assets.directory`, no `main` worker), so every route here must be
// reachable at the exact URL the SSG build writes to disk. A dynamic segment
// can't be combined with a literal suffix in honox's file router, so the
// filename `[slug].json.ts` produces a Hono param literally named
// "slug.json" (Hono param names may contain dots; only `{`/`}` are
// disallowed) that matches greedily, e.g. both `/api/posts/foo` and
// `/api/posts/foo.json`. Stripping the suffix here makes both forms work in
// dev, while prod only ever has the `.json` file on disk — so always fetch
// with the suffix.
export default createRoute(
	// Only non-draft slugs, matching the filtering loadPostBySlug applies below.
	ssgParams(async () => {
		const { posts } = await loadPosts();
		return posts.map((post) => ({ "slug.json": `${post.slug}.json` }));
	}),

	async (c) => {
		const slug = c.req.param("slug.json").replace(/\.json$/, "");
		const post = await loadPostBySlug(slug);

		if (!post) {
			return c.json({ error: "Post not found" }, 404);
		}

		return c.json(post);
	},
);
