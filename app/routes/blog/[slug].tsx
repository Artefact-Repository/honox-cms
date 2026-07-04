import { createRoute } from "honox/factory";
import { ssgParams } from "hono/ssg";
import { parseFrontmatter, markdownToHtml } from "../../utils/markdown";

// Use Vite's import.meta.glob to import all markdown files at build time
const posts = import.meta.glob("/content/posts/*.md", {
	query: "?raw",
	import: "default",
});

export default createRoute(
	// Use ssgParams middleware to tell SSG which params to generate
	ssgParams(async () => {
		const posts = import.meta.glob("/content/posts/*.md", {
			query: "?raw",
			import: "default",
		});

		const slugs: { slug: string }[] = [];

		for (const path of Object.keys(posts)) {
			const slug = path.replace("/content/posts/", "").replace(".md", "");
			slugs.push({ slug });
		}

		return slugs;
	}),

	// Actual route handler
	async (c) => {
		const slug = c.req.param("slug");
		const postPath = `/content/posts/${slug}.md`;

		// Find the post with matching slug
		const loader = posts[postPath];

		if (!loader) {
			return c.notFound();
		}

		try {
			const markdown = await (loader as () => Promise<string>)();
			const { data, content } = parseFrontmatter(markdown);
			const htmlContent = markdownToHtml(content);

			return c.render(
				<div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
					<a
						href="/blog"
						style={{
							display: "inline-block",
							marginBottom: "2rem",
							color: "#1976d2",
							textDecoration: "none",
						}}
					>
						← Back to Blog
					</a>

					<article>
						<header style={{ marginBottom: "2rem" }}>
							<h1
								style={{
									fontSize: "2.5rem",
									marginBottom: "0.5rem",
									color: "#333",
								}}
							>
								{data.title || "Untitled"}
								{data.draft === true && (
									<span
										style={{
											fontSize: "0.875rem",
											backgroundColor: "#ff9800",
											color: "white",
											padding: "0.25rem 0.75rem",
											borderRadius: "4px",
											marginLeft: "1rem",
										}}
									>
										Draft
									</span>
								)}
							</h1>

							{data.date && (
								<time
									datetime={data.date}
									style={{
										color: "#666",
										fontSize: "1rem",
										display: "block",
										marginBottom: "1rem",
									}}
								>
									{new Date(data.date).toLocaleDateString("en-US", {
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</time>
							)}

							{data.description && (
								<p
									style={{
										color: "#555",
										fontSize: "1.25rem",
										lineHeight: 1.6,
										fontStyle: "italic",
									}}
								>
									{data.description}
								</p>
							)}

							{Array.isArray(data.tags) && data.tags.length > 0 && (
								<div
									style={{
										display: "flex",
										gap: "0.5rem",
										flexWrap: "wrap",
										marginTop: "1rem",
									}}
								>
									{data.tags.map((tag: string) => (
										<span
											key={tag}
											style={{
												backgroundColor: "#e3f2fd",
												color: "#1976d2",
												padding: "0.25rem 0.75rem",
												borderRadius: "16px",
												fontSize: "0.875rem",
											}}
										>
											{tag}
										</span>
									))}
								</div>
							)}
						</header>

						<div
							style={{
								lineHeight: 1.8,
								fontSize: "1.125rem",
								color: "#333",
							}}
							dangerouslySetInnerHTML={{ __html: htmlContent }}
						/>
					</article>
				</div>,
			);
		} catch (error) {
			console.error(`Error loading post ${slug}:`, error);
			return c.notFound();
		}
	},
);
