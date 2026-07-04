import { createRoute } from "honox/factory";
import { ssgParams } from "hono/ssg";
import { parseFrontmatter } from "../../../utils/markdown";

// Use Vite's import.meta.glob to import all markdown files at build time
const posts = import.meta.glob("/content/posts/*.md", {
	query: "?raw",
	import: "default",
});

interface BlogPost {
	slug: string;
	title: string;
	date: string;
	description: string;
	tags: string[];
	draft: boolean;
}

export default createRoute(
	// Use ssgParams middleware to tell SSG which params to generate
	ssgParams(async () => {
		const posts = import.meta.glob("/content/posts/*.md", {
			query: "?raw",
			import: "default",
		});

		const allTags = new Set<string>();

		for (const [path, loader] of Object.entries(posts)) {
			try {
				const markdown = await (loader as () => Promise<string>)();
				const { data } = parseFrontmatter(markdown);

				if (data.draft === true && process.env.NODE_ENV === "production") {
					continue;
				}

				const postTags = Array.isArray(data.tags) ? data.tags : [];
				postTags.forEach((tag: string) => allTags.add(tag));
			} catch (error) {
				// Ignore errors
			}
		}

		return Array.from(allTags).map((tag) => ({ tag }));
	}),

	// Actual route handler
	async (c) => {
		const tagFilter = c.req.param("tag");

		// Load and parse all blog posts
		const blogPosts: BlogPost[] = [];

		for (const [path, loader] of Object.entries(posts)) {
			try {
				const markdown = await (loader as () => Promise<string>)();
				const { data } = parseFrontmatter(markdown);

				// Skip drafts in production
				if (data.draft === true && process.env.NODE_ENV === "production") {
					continue;
				}

				const slug = path.replace("/content/posts/", "").replace(".md", "");

				// Filter by tag
				const postTags = Array.isArray(data.tags) ? data.tags : [];
				if (!postTags.includes(tagFilter)) {
					continue;
				}

				blogPosts.push({
					slug,
					title: data.title || "Untitled",
					date: data.date || "",
					description: data.description || "",
					tags: postTags,
					draft: data.draft === true,
				});
			} catch (error) {
				console.error(`Error loading ${path}:`, error);
			}
		}

		// Sort posts by date (newest first)
		blogPosts.sort((a, b) => {
			const dateA = new Date(a.date).getTime();
			const dateB = new Date(b.date).getTime();
			return dateB - dateA;
		});

		// Get unique tags for filter UI
		const allTags = new Set<string>();
		for (const [path, loader] of Object.entries(posts)) {
			try {
				const markdown = await (loader as () => Promise<string>)();
				const { data } = parseFrontmatter(markdown);

				if (data.draft === true && process.env.NODE_ENV === "production") {
					continue;
				}

				const postTags = Array.isArray(data.tags) ? data.tags : [];
				postTags.forEach((tag: string) => allTags.add(tag));
			} catch (error) {
				// Ignore errors
			}
		}

		const tags = Array.from(allTags).sort();

		return c.render(
			<div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
				<h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
					Posts tagged: "{tagFilter}"
				</h1>
				<a
					href="/blog"
					style={{
						display: "inline-block",
						marginBottom: "2rem",
						color: "#1976d2",
						textDecoration: "none",
					}}
				>
					← All posts
				</a>

				{/* Tag Filter UI */}
				{tags.length > 0 && (
					<div
						style={{
							marginBottom: "2rem",
							display: "flex",
							gap: "0.5rem",
							flexWrap: "wrap",
							alignItems: "center",
						}}
					>
						<span style={{ fontWeight: "bold", marginRight: "0.5rem" }}>
							Filter by:
						</span>
						<a
							href="/blog"
							style={{
								padding: "0.5rem 1rem",
								borderRadius: "20px",
								backgroundColor: "#e0e0e0",
								color: "#333",
								textDecoration: "none",
								fontSize: "0.875rem",
							}}
						>
							All
						</a>
						{tags.map((tag) => (
							<a
								key={tag}
								href={`/blog/tag/${tag}`}
								style={{
									padding: "0.5rem 1rem",
									borderRadius: "20px",
									backgroundColor: tag === tagFilter ? "#1976d2" : "#e0e0e0",
									color: tag === tagFilter ? "white" : "#333",
									textDecoration: "none",
									fontSize: "0.875rem",
								}}
							>
								{tag}
							</a>
						))}
					</div>
				)}

				{blogPosts.length === 0 && (
					<p style={{ color: "#666", fontSize: "1.125rem" }}>
						No posts found with tag "{tagFilter}".
					</p>
				)}

				<div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
					{blogPosts.map((post) => (
						<article
							key={post.slug}
							style={{
								border: "1px solid #e0e0e0",
								borderRadius: "8px",
								padding: "1.5rem",
								backgroundColor: "#fafafa",
							}}
						>
							<h2 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
								<a
									href={`/blog/${post.slug}`}
									style={{ color: "#333", textDecoration: "none" }}
								>
									{post.title}
									{post.draft && (
										<span
											style={{
												fontSize: "0.75rem",
												backgroundColor: "#ff9800",
												color: "white",
												padding: "0.25rem 0.5rem",
												borderRadius: "4px",
												marginLeft: "0.5rem",
											}}
										>
											Draft
										</span>
									)}
								</a>
							</h2>

							<time
								datetime={post.date}
								style={{
									color: "#666",
									fontSize: "0.875rem",
									display: "block",
									marginBottom: "0.75rem",
								}}
							>
								{new Date(post.date).toLocaleDateString("en-US", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</time>

							{post.description && (
								<p
									style={{
										color: "#555",
										lineHeight: 1.6,
										marginBottom: "1rem",
									}}
								>
									{post.description}
								</p>
							)}

							{post.tags.length > 0 && (
								<div
									style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
								>
									{post.tags.map((tag) => (
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
						</article>
					))}
				</div>
			</div>,
		);
	},
);
