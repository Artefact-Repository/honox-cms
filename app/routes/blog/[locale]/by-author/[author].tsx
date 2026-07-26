import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { TRANSLATED_LOCALES } from "../../../../lib/i18n";
import { loadPosts } from "../../../../lib/posts";
import byAuthorRoute from "../../by-author/[author]";

// Reuse the exact same per-request handler as the unprefixed
// /blog/by-author/:author route — see the by-tag/[tag].tsx sibling for why
// this is safe (typed 2-tuple from honox/factory's createRoute).
const [, byAuthorHandler] = byAuthorRoute;

export default createRoute(
	// Author names could in principle differ per locale (a translated post's
	// frontmatter `author` field), so each locale's author set is collected
	// from its own loadPosts(locale) rather than assumed to match English's.
	ssgParams(async () => {
		const params: { locale: string; author: string }[] = [];
		for (const locale of TRANSLATED_LOCALES) {
			const { posts } = await loadPosts(locale);
			const authors = new Set<string>();
			for (const post of posts) {
				authors.add(post.author || "Artefact Team");
			}
			for (const author of authors) {
				params.push({ locale, author });
			}
		}
		return params;
	}),
	byAuthorHandler,
);
