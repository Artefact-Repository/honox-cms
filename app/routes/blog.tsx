import { createRoute } from "honox/factory";
import { css } from "styled-system/css";
import { Badge, Button, Card, Drawer, Heading, Text } from "../components/ui";

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
	author?: string;
}

const posts: BlogPost[] = [
	{
		slug: "getting-started-with-honox",
		title: "Getting Started with HonoX",
		description:
			"Learn how to build full-stack applications with HonoX, the meta-framework built on top of Hono. This comprehensive guide covers routing, middleware, and deployment strategies.",
		date: "2026-06-28",
		category: "Tutorial",
		categoryColor: "blue",
		readTime: "5 min read",
		author: "Jane Cooper",
	},
	{
		slug: "pandacss-design-tokens",
		title: "Design Tokens with PandaCSS",
		description:
			"A deep dive into using PandaCSS design tokens to create consistent, maintainable design systems. Learn how to leverage the power of type-safe CSS-in-JS.",
		date: "2026-06-22",
		category: "Design",
		categoryColor: "purple",
		readTime: "8 min read",
		author: "Sarah Chen",
	},
	{
		slug: "server-components-islands",
		title: "Server Components & Islands Architecture",
		description:
			"Understanding the islands architecture pattern for building performant web applications with minimal client-side JavaScript. Perfect for modern web development.",
		date: "2026-06-15",
		category: "Architecture",
		categoryColor: "green",
		readTime: "6 min read",
		author: "Mike Johnson",
	},
	{
		slug: "building-accessible-ui",
		title: "Building Accessible UI Components",
		description:
			"Best practices for creating accessible, keyboard-navigable components that work for everyone. WCAG 2.1 AA compliance made practical.",
		date: "2026-06-10",
		category: "Accessibility",
		categoryColor: "orange",
		readTime: "7 min read",
		author: "Emma Davis",
	},
	{
		slug: "type-safe-css-in-js",
		title: "Type-Safe CSS-in-JS with PandaCSS",
		description:
			"How PandaCSS brings type safety to your styles without runtime overhead. Zero-runtime CSS-in-JS for better developer experience.",
		date: "2026-06-03",
		category: "TypeScript",
		categoryColor: "cyan",
		readTime: "4 min read",
		author: "Alex Rivera",
	},
	{
		slug: "responsive-design-2026",
		title: "Responsive Design Patterns for 2026",
		description:
			"Modern approaches to responsive design using container queries, grid, and flexible layouts. Move beyond breakpoints to truly adaptive interfaces.",
		date: "2026-05-28",
		category: "Design",
		categoryColor: "purple",
		readTime: "10 min read",
		author: "Lisa Park",
	},
	{
		slug: "performance-optimization",
		title: "Web Performance Optimization Guide",
		description:
			"Core Web Vitals, bundle optimization, image compression, and caching strategies. Everything you need to know about making your site fast.",
		date: "2026-05-20",
		category: "Performance",
		categoryColor: "red",
		readTime: "12 min read",
		author: "Tom Wright",
	},
	{
		slug: "testing-strategies",
		title: "Frontend Testing Strategies",
		description:
			"Unit tests, integration tests, E2E tests - when to use what. A practical guide to testing frontend applications effectively.",
		date: "2026-05-15",
		category: "Testing",
		categoryColor: "amber",
		readTime: "9 min read",
		author: "Jane Cooper",
	},
];

const categories = [
	"All",
	...Array.from(new Set(posts.map((p) => p.category))),
];

const categoryColorMap: Record<string, string> = {
	Tutorial: "blue",
	Design: "purple",
	Architecture: "green",
	Accessibility: "orange",
	TypeScript: "cyan",
	Performance: "red",
	Testing: "amber",
};

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase();
}

function BlogPostCard({
	post,
	featured = false,
}: {
	post: BlogPost;
	featured?: boolean;
}) {
	const initials = post.author ? getInitials(post.author) : "?";

	return (
		<Card.Root
			class={css({
				position: "relative",
				transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
				cursor: "pointer",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				borderWidth: "1px",
				borderColor: "border",
				bg: "bg",
				_hover: {
					shadow: featured ? "xl" : "lg",
					translateY: "-2px",
					borderColor: "blue.300",
					"& article": {
						borderTopColor: "blue.200",
					},
				},
				_active: {
					translateY: "0",
				},
			})}
		>
			<Card.Header>
				<div
					class={css({
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: "3",
						gap: "2",
					})}
				>
					<Badge
						variant="subtle"
						colorPalette={post.categoryColor}
						class={css({
							fontSize: "xs",
							px: "2.5",
							py: "0.5",
							borderRadius: "full",
						})}
					>
						{post.category}
					</Badge>
					<Text
						size="xs"
						class={css({
							color: "fg.muted",
							whiteSpace: "nowrap",
							display: "flex",
							alignItems: "center",
							gap: "1",
						})}
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<title>Read time</title>
							<circle cx="12" cy="12" r="10" />
							<polyline points="12 6 12 12 16 14" />
						</svg>
						{post.readTime}
					</Text>
				</div>
				<Card.Title
					class={css({
						fontSize: featured ? "2xl" : "lg",
						lineHeight: "tight",
						mb: "2",
						color: "fg",
						_hover: { color: "blue.600" },
						transition: "color 0.2s",
					})}
				>
					{post.title}
				</Card.Title>
			</Card.Header>
			<Card.Body class={css({ flex: "1" })}>
				<Text
					size="sm"
					class={css({
						color: "fg.muted",
						lineHeight: "relaxed",
						display: "-webkit-box",
						webkitLineClamp: "3",
						webkitBoxOrient: "vertical",
						overflow: "hidden",
					})}
				>
					{post.description}
				</Text>
			</Card.Body>
			<Card.Footer
				class={css({
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					pt: "4",
					borderTopWidth: "1px",
					borderColor: "border.subtle",
				})}
			>
				<div class={css({ display: "flex", alignItems: "center", gap: "2.5" })}>
					<div
						class={css({
							width: "8",
							height: "8",
							borderRadius: "full",
							bg: "blue.500",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: "white",
							fontSize: "xs",
							fontWeight: "bold",
							flexShrink: "0",
						})}
					>
						{initials}
					</div>
					<div
						class={css({
							display: "flex",
							flexDirection: "column",
							gap: "0.5",
						})}
					>
						<Text
							size="xs"
							class={css({
								color: "fg.subtle",
								fontWeight: "medium",
								lineHeight: "tight",
							})}
						>
							{post.author}
						</Text>
						<Text
							size="xs"
							class={css({ color: "fg.muted", lineHeight: "tight" })}
						>
							{formatDate(post.date)}
						</Text>
					</div>
				</div>
				<Button
					variant="ghost"
					size="sm"
					colorPalette="blue"
					class={css({
						_hover: { bg: "blue.50" },
						fontWeight: "medium",
					})}
				>
					Read more
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						style={{ marginLeft: "4px", display: "inline" }}
					>
						<title>Arrow</title>
						<path d="M5 12h14M12 5l7 7-7 7" />
					</svg>
				</Button>
			</Card.Footer>
		</Card.Root>
	);
}

export default createRoute((c) => {
	const searchQuery = c.req.query("q") ?? "";
	const categoryFilter = c.req.query("category") ?? "All";

	const filteredPosts = posts.filter((post) => {
		const matchesSearch =
			!searchQuery ||
			post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			post.category.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesCategory =
			categoryFilter === "All" || post.category === categoryFilter;

		return matchesSearch && matchesCategory;
	});

	const featuredPost = filteredPosts[0];
	const remainingPosts = filteredPosts.slice(1);

	// Build the current URL for form actions
	const currentPath = "/blog";

	return c.render(
		<div
			class={css({
				py: { base: "8", md: "12" },
				px: { base: "4", md: "6", lg: "8" },
				maxWidth: "7xl",
				mx: "auto",
			})}
		>
			<title>Blog - Artefact</title>

			{/* Hero Header Section */}
			<header
				class={css({ textAlign: "center", mb: "12", position: "relative" })}
			>
				<div
					class={css({
						display: "inline-flex",
						alignItems: "center",
						gap: "2",
						mb: "4",
						px: "4",
						py: "1.5",
						bg: "blue.50",
						borderRadius: "full",
						borderWidth: "1px",
						borderColor: "blue.100",
					})}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						class={css({ color: "blue.500" })}
					>
						<title>Latest</title>
						<path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
					</svg>
					<Text
						size="sm"
						class={css({ color: "blue.600", fontWeight: "medium" })}
					>
						Latest Articles
					</Text>
				</div>
				<Heading
					as="h1"
					size={{ base: "3xl", md: "4xl", lg: "5xl" }}
					class={css({
						fontWeight: "bold",
						mb: "4",
						letterSpacing: "tight",
						bgGradient: "to-r",
						gradientFrom: "blue.600",
						gradientTo: "purple.600",
						bgClip: "text",
						css: { WebkitTextFillColor: "transparent" },
					})}
				>
					Blog
				</Heading>
				<Text
					size={{ base: "md", md: "lg" }}
					class={css({
						color: "fg.muted",
						maxWidth: "2xl",
						mx: "auto",
						lineHeight: "relaxed",
					})}
				>
					Thoughts on web development, design systems, and building better
					developer experiences. Stay updated with the latest trends and best
					practices.
				</Text>
			</header>

			{/* Results Count & Filter Button Row */}
			<section
				class={css({
					mb: "8",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: "4",
					flexWrap: "wrap",
				})}
			>
				<Text
					size="sm"
					class={css({ color: "fg.muted", fontWeight: "medium" })}
				>
					Showing {filteredPosts.length} article
					{filteredPosts.length !== 1 ? "s" : ""}
					{searchQuery && ` for "${searchQuery}"`}
					{categoryFilter !== "All" && ` in ${categoryFilter}`}
				</Text>

				<Drawer.Root interactive>
					<Drawer.Trigger asChild>
						<Button
							variant="outline"
							size="sm"
							class={css({
								display: "flex",
								alignItems: "center",
								gap: "2",
								px: "4",
								flexShrink: "0",
							})}
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<title>Filter</title>
								<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
							</svg>
							Filter
							{(searchQuery || categoryFilter !== "All") && (
								<Badge
									variant="solid"
									colorPalette="blue"
									size="sm"
									class={css({ borderRadius: "full", ml: "1" })}
								>
									{(searchQuery ? 1 : 0) + (categoryFilter !== "All" ? 1 : 0)}
								</Badge>
							)}
						</Button>
					</Drawer.Trigger>
					<Drawer.Backdrop />
					<Drawer.Positioner>
						<Drawer.Content>
							<Drawer.Header>
								<Drawer.Title>Search & Filter</Drawer.Title>
								<Drawer.Description>
									Find articles by keyword or browse by category
								</Drawer.Description>
							</Drawer.Header>
							<Drawer.Body>
								{/* Search Section */}
								<div class={css({ mb: "8" })}>
									<Text
										size="sm"
										class={css({
											fontWeight: "semibold",
											mb: "3",
											display: "block",
											color: "fg.subtle",
										})}
									>
										Search Articles
									</Text>
									<form
										action={currentPath}
										method="GET"
										class={css({
											display: "flex",
											flexDirection: "column",
											gap: "3",
										})}
									>
										{categoryFilter !== "All" && (
											<input
												type="hidden"
												name="category"
												value={categoryFilter}
											/>
										)}
										<div class={css({ position: "relative" })}>
											<div
												class={css({
													position: "absolute",
													left: "3",
													top: "50%",
													transform: "translateY(-50%)",
													color: "fg.muted",
													pointerEvents: "none",
												})}
											>
												<svg
													width="18"
													height="18"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
												>
													<title>Search</title>
													<circle cx="11" cy="11" r="8" />
													<path d="m21 21-4.3-4.3" />
												</svg>
											</div>
											<input
												type="search"
												name="q"
												placeholder="Type to search..."
												value={searchQuery}
												autofocus
												class={css({
													width: "full",
													pl: "10",
													pr: "4",
													py: "3",
													borderWidth: "2px",
													borderRadius: "lg",
													bg: "bg",
													color: "fg",
													borderColor: "border",
													fontSize: "md",
													_focus: {
														outline: "none",
														borderColor: "blue.500",
														shadow: "0 0 0 3px var(--colors-blue-100)",
													},
													_placeholder: { color: "fg.muted" },
												})}
											/>
										</div>
										<div
											class={css({
												display: "flex",
												gap: "2",
												justifyContent: "flex-end",
											})}
										>
											{searchQuery && (
												<a
													href={
														currentPath +
														(categoryFilter !== "All"
															? `?category=${categoryFilter}`
															: "")
													}
													style={{ textDecoration: "none" }}
												>
													<Button variant="ghost" size="sm">
														Clear
													</Button>
												</a>
											)}
											<Button
												type="submit"
												variant="solid"
												colorPalette="blue"
												size="sm"
											>
												Apply
											</Button>
										</div>
									</form>
								</div>

								{/* Divider */}
								<div
									class={css({
										my: "6",
										borderTopWidth: "1px",
										borderColor: "border.subtle",
									})}
								/>

								{/* Category Filter Section */}
								<div>
									<Text
										size="sm"
										class={css({
											fontWeight: "semibold",
											mb: "3",
											display: "block",
											color: "fg.subtle",
										})}
									>
										Filter by Category
									</Text>
									<div
										class={css({
											display: "flex",
											flexDirection: "column",
											gap: "1",
										})}
									>
										{categories.map((cat) => {
											return (
												<form
													key={cat}
													action={currentPath}
													method="GET"
													class={css({ display: "contents" })}
												>
													{searchQuery && (
														<input type="hidden" name="q" value={searchQuery} />
													)}
													{cat !== "All" && (
														<input type="hidden" name="category" value={cat} />
													)}
													<Button
														type="submit"
														variant={categoryFilter === cat ? "solid" : "ghost"}
														colorPalette={
															categoryFilter === cat ? "blue" : "gray"
														}
														size="sm"
														class={css({
															width: "full",
															justifyContent: "space-between",
															transition: "all 0.2s",
															cursor: "pointer",
															py: "2.5",
														})}
													>
														<span>{cat}</span>
														{categoryFilter === cat && (
															<svg
																width="16"
																height="16"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2.5"
															>
																<title>Selected</title>
																<polyline points="20 6 9 17 4 12" />
															</svg>
														)}
													</Button>
												</form>
											);
										})}
									</div>
								</div>

								{/* Active Filters */}
								{(searchQuery || categoryFilter !== "All") && (
									<div
										class={css({
											mt: "8",
											pt: "6",
											borderTopWidth: "1px",
											borderColor: "border.subtle",
										})}
									>
										<Text
											size="xs"
											class={css({
												color: "fg.muted",
												mb: "3",
												fontWeight: "semibold",
												textTransform: "uppercase",
												letterSpacing: "wide",
											})}
										>
											Active Filters
										</Text>
										<div
											class={css({
												display: "flex",
												flexWrap: "wrap",
												gap: "2",
												alignItems: "center",
											})}
										>
											{searchQuery && (
												<Badge
													variant="subtle"
													colorPalette="blue"
													class={css({ px: "3", py: "1.5" })}
												>
													Search: "{searchQuery}"
												</Badge>
											)}
											{categoryFilter !== "All" && (
												<Badge
													variant="subtle"
													colorPalette="green"
													class={css({ px: "3", py: "1.5" })}
												>
													{categoryFilter}
												</Badge>
											)}
											<a href={currentPath} style={{ textDecoration: "none" }}>
												<Button variant="link" size="xs" colorPalette="red">
													Clear all
												</Button>
											</a>
										</div>
									</div>
								)}
							</Drawer.Body>
						</Drawer.Content>
					</Drawer.Positioner>
				</Drawer.Root>
			</section>

			{/* Featured Post */}
			{featuredPost && (
				<section class={css({ mb: "12" })}>
					<div
						class={css({
							display: "flex",
							alignItems: "center",
							gap: "2",
							mb: "4",
						})}
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="currentColor"
							class={css({ color: "amber.500" })}
						>
							<title>Featured</title>
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
						</svg>
						<Text
							size="sm"
							class={css({ fontWeight: "semibold", color: "amber.600" })}
						>
							Featured Post
						</Text>
					</div>
					<div
						class={css({
							position: "relative",
							"&::before": {
								content: '""',
								position: "absolute",
								inset: "-3px",
								borderRadius: "2xl",
								bgGradient: "to-r",
								gradientFrom: "blue.200",
								gradientTo: "purple.200",
								opacity: "0.5",
								zIndex: "0",
							},
						})}
					>
						<div
							class={css({
								position: "relative",
								zIndex: "1",
							})}
						>
							<BlogPostCard post={featuredPost} featured />
						</div>
					</div>
				</section>
			)}

			{/* Posts Grid */}
			{remainingPosts.length > 0 && (
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
						{remainingPosts.map((post) => (
							<BlogPostCard key={post.slug} post={post} />
						))}
					</div>
				</section>
			)}

			{/* Empty State */}
			{filteredPosts.length === 0 && (
				<section
					class={css({
						textAlign: "center",
						py: "20",
						px: "4",
					})}
				>
					<div
						class={css({
							width: "20",
							height: "20",
							mx: "auto",
							mb: "6",
							color: "fg.muted",
							bg: "gray.50",
							borderRadius: "full",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						})}
					>
						<svg
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
						>
							<title>No results</title>
							<path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>
					<Heading as="h3" size="lg" class={css({ mb: "2" })}>
						No articles found
					</Heading>
					<Text size="md" class={css({ color: "fg.muted", mb: "6" })}>
						Try adjusting your search or filter to find what you're looking for.
					</Text>
					<a href={currentPath} style={{ textDecoration: "none" }}>
						<Button variant="outline">Clear all filters</Button>
					</a>
				</section>
			)}

			{/* Newsletter Subscription */}
			<section
				class={css({
					mt: "16",
					p: { base: "8", md: "10" },
					bgGradient: "to-br",
					gradientFrom: "blue.50",
					gradientTo: "purple.50",
					borderRadius: "3xl",
					textAlign: "center",
					borderWidth: "1px",
					borderColor: "blue.100",
					position: "relative",
					overflow: "hidden",
				})}
			>
				<div
					class={css({
						position: "absolute",
						top: "0",
						left: "0",
						right: "0",
						bottom: "0",
						opacity: "0.03",
						bgGradient: "to-r",
						gradientFrom: "blue.500",
						gradientTo: "purple.500",
					})}
				/>
				<div class={css({ position: "relative", zIndex: "1" })}>
					<div
						class={css({
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							width: "12",
							height: "12",
							borderRadius: "full",
							bg: "blue.100",
							color: "blue.600",
							mb: "4",
						})}
					>
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<title>Newsletter</title>
							<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
							<polyline points="22,6 12,13 2,6" />
						</svg>
					</div>
					<Heading as="h3" size="xl" class={css({ mb: "2" })}>
						Stay Updated
					</Heading>
					<Text
						size="md"
						class={css({
							color: "fg.muted",
							mb: "6",
							maxWidth: "md",
							mx: "auto",
						})}
					>
						Get the latest articles delivered to your inbox. No spam,
						unsubscribe at any time.
					</Text>
					<form
						class={css({
							display: "flex",
							gap: "2",
							maxWidth: "md",
							mx: "auto",
							flexDirection: { base: "column", sm: "row" },
						})}
					>
						<div
							class={css({
								position: "relative",
								flex: "1",
							})}
						>
							<div
								class={css({
									position: "absolute",
									left: "3",
									top: "50%",
									transform: "translateY(-50%)",
									color: "fg.muted",
									pointerEvents: "none",
								})}
							>
								<svg
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<title>Email</title>
									<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
									<polyline points="22,6 12,13 2,6" />
								</svg>
							</div>
							<input
								type="email"
								name="email"
								placeholder="Enter your email"
								required
								class={css({
									width: "full",
									pl: "10",
									pr: "4",
									py: "3",
									borderWidth: "2px",
									borderRadius: "lg",
									bg: "white",
									color: "fg",
									borderColor: "blue.200",
									fontSize: "md",
									_focus: {
										outline: "none",
										borderColor: "blue.500",
										shadow: "0 0 0 3px var(--colors-blue-100)",
									},
									_placeholder: { color: "fg.muted" },
								})}
							/>
						</div>
						<Button
							type="submit"
							variant="solid"
							colorPalette="blue"
							size="md"
							class={css({ px: "6" })}
						>
							Subscribe
						</Button>
					</form>
				</div>
			</section>
		</div>,
	);
});
