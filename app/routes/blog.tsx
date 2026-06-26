import { createRoute } from "honox/factory";
import { css } from "styled-system/css";
import { Badge, Button, Card, Heading, Text } from "../components/ui";

interface BlogPost {
	slug: string;
	title: string;
	description: string;
	date: string;
	category: string;
	categoryColor:
		| "blue"
		| "green"
		| "purple"
		| "orange"
		| "cyan"
		| "red"
		| "amber";
	readTime: string;
}

const posts: BlogPost[] = [
	{
		slug: "getting-started-with-honox",
		title: "Getting Started with HonoX",
		description:
			"Learn how to build full-stack applications with HonoX, the meta-framework built on top of Hono.",
		date: "2026-06-28",
		category: "Tutorial",
		categoryColor: "blue",
		readTime: "5 min read",
	},
	{
		slug: "pandacss-design-tokens",
		title: "Design Tokens with PandaCSS",
		description:
			"A deep dive into using PandaCSS design tokens to create consistent, maintainable design systems.",
		date: "2026-06-22",
		category: "Design",
		categoryColor: "purple",
		readTime: "8 min read",
	},
	{
		slug: "server-components-islands",
		title: "Server Components & Islands Architecture",
		description:
			"Understanding the islands architecture pattern for building performant web applications with minimal client-side JavaScript.",
		date: "2026-06-15",
		category: "Architecture",
		categoryColor: "green",
		readTime: "6 min read",
	},
	{
		slug: "building-accessible-ui",
		title: "Building Accessible UI Components",
		description:
			"Best practices for creating accessible, keyboard-navigable components that work for everyone.",
		date: "2026-06-10",
		category: "Accessibility",
		categoryColor: "orange",
		readTime: "7 min read",
	},
	{
		slug: "type-safe-css-in-js",
		title: "Type-Safe CSS-in-JS with PandaCSS",
		description:
			"How PandaCSS brings type safety to your styles without runtime overhead.",
		date: "2026-06-03",
		category: "TypeScript",
		categoryColor: "cyan",
		readTime: "4 min read",
	},
];

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function BlogPostCard({ post }: { post: BlogPost }) {
	return (
		<Card.Root
			class={css({
				transition: "all 0.2s",
				_hover: { shadow: "md", translateY: "-1px" },
			})}
		>
			<Card.Header>
				<div
					class={css({
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: "2",
					})}
				>
					<Badge variant="subtle" colorPalette={post.categoryColor}>
						{post.category}
					</Badge>
					<Text
						size="xs"
						class={css({ color: "fg.muted", whiteSpace: "nowrap" })}
					>
						{post.readTime}
					</Text>
				</div>
				<Card.Title class={css({ fontSize: "lg", lineHeight: "tight" })}>
					{post.title}
				</Card.Title>
			</Card.Header>
			<Card.Body>
				<Text size="sm" class={css({ color: "fg.muted" })}>
					{post.description}
				</Text>
			</Card.Body>
			<Card.Footer
				class={css({
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				})}
			>
				<Text size="xs" class={css({ color: "fg.subtle" })}>
					{formatDate(post.date)}
				</Text>
				<Button variant="link" size="sm" colorPalette="blue">
					Read more
				</Button>
			</Card.Footer>
		</Card.Root>
	);
}

export default createRoute((c) => {
	return c.render(
		<div class={css({ py: "12", px: "4", maxWidth: "5xl", mx: "auto" })}>
			<title>Blog</title>

			{/* Header */}
			<header class={css({ textAlign: "center", mb: "12" })}>
				<Heading
					as="h1"
					size="4xl"
					class={css({ fontWeight: "bold", mb: "4" })}
				>
					Blog
				</Heading>
				<Text
					size="lg"
					class={css({ color: "fg.muted", maxWidth: "2xl", mx: "auto" })}
				>
					Thoughts on web development, design systems, and building better
					developer experiences.
				</Text>
			</header>

			{/* Featured Post */}
			<section class={css({ mb: "12" })}>
				<Card.Root
					class={css({
						bg: "gray.2",
						transition: "all 0.2s",
						_hover: { shadow: "lg" },
					})}
				>
					<Card.Header>
						<div
							class={css({
								display: "flex",
								gap: "2",
								alignItems: "center",
								mb: "3",
							})}
						>
							<Badge variant="solid" colorPalette="amber">
								Featured
							</Badge>
							<Badge variant="subtle" colorPalette={posts[0].categoryColor}>
								{posts[0].category}
							</Badge>
						</div>
						<Card.Title class={css({ fontSize: "2xl", lineHeight: "tight" })}>
							{posts[0].title}
						</Card.Title>
					</Card.Header>
					<Card.Body>
						<Text class={css({ color: "fg.muted", fontSize: "md" })}>
							{posts[0].description}
						</Text>
					</Card.Body>
					<Card.Footer
						class={css({
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						})}
					>
						<div
							class={css({
								display: "flex",
								gap: "3",
								alignItems: "center",
							})}
						>
							<Text size="sm" class={css({ color: "fg.subtle" })}>
								{formatDate(posts[0].date)}
							</Text>
							<Text size="sm" class={css({ color: "fg.subtle" })}>
								{posts[0].readTime}
							</Text>
						</div>
						<Button variant="solid" size="sm" colorPalette="blue">
							Read article
						</Button>
					</Card.Footer>
				</Card.Root>
			</section>

			{/* Posts Grid */}
			<section>
				<Heading
					as="h2"
					size="xl"
					class={css({ mb: "6", fontWeight: "semibold" })}
				>
					Latest Posts
				</Heading>
				<div
					class={css({
						display: "grid",
						gridTemplateColumns: {
							base: "1fr",
							md: "repeat(2, 1fr)",
							lg: "repeat(3, 1fr)",
						},
						gap: "6",
					})}
				>
					{posts.slice(1).map((post) => (
						<BlogPostCard key={post.slug} post={post} />
					))}
				</div>
			</section>
		</div>,
	);
});
