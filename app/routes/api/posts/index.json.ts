import { createRoute } from "honox/factory";
import { loadPosts } from "../../../lib/posts";

// GET /api/posts/index.json — the post collection: every published post
// (drafts excluded in production, same as the blog index page), newest
// first, without body content. Pair with GET /api/posts/:slug.json for a
// single post's full detail.
export default createRoute(async (c) => {
	const { posts, tags } = await loadPosts();

	return c.json({
		generated: new Date().toISOString(),
		total: posts.length,
		tags,
		posts,
	});
});
